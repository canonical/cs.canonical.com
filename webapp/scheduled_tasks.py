import logging
import os
from datetime import datetime
from pathlib import Path
import re

import yaml
from flask import Flask

from webapp import create_app
from webapp.models import Asset, JiraTask, Project, Webpage, db
from webapp.settings import BASE_DIR
from webapp.site_repository import SiteRepository
from webapp.tasks import register_task
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)

# Default delay between runs for updating the tree
TASK_DELAY = int(os.getenv("TASK_DELAY", "30"))
# Default delay between runs for updating Jira task statuses
UPDATE_STATUS_DELAY = int(os.getenv("UPDATE_STATUS_DELAY", "5"))
# Default delay between runs for parsing webpage assets
PARSE_ASSETS_DELAY = int(os.getenv("PARSE_ASSETS_DELAY", "1440"))


@register_task(delay=TASK_DELAY)
def load_site_trees() -> None:
    """Load the site trees from the queue."""
    app = create_app()
    yaml_path = Path(BASE_DIR) / "data/sites.yaml"

    with app.app_context(), yaml_path.open("r") as f:
        data = yaml.safe_load(f)
        for site in data["sites"]:
            logger.info(f"Loading site tree for {site}")

            try:
                # Enqueue the sites for setup
                site_repository = SiteRepository(site, app, db=db)
                # build the tree from GH source without using cache
                site_repository.get_tree()
            except Exception as e:
                logger.error(e, exc_info=True)


@register_task(delay=UPDATE_STATUS_DELAY)
def update_jira_statuses() -> None:
    """Get the status of a Jira task and update it if it changed.

    Args:
        app (Flask): The Flask application instance.

    """
    app = create_app()
    with app.app_context():
        app.logger.info("Running scheduled task: update_jira_statuses")

        jira = app.config.get("JIRA")
        if not jira:
            app.logger.error("JIRA configuration not found")
            return
        jira_tasks = JiraTask.query.all()
        if jira_tasks:
            project_ids = []
            for task in jira_tasks:
                response = jira.get_issue_statuses(task.jira_id)
                if task.status != response["fields"]["status"]["name"].upper():
                    task.status = response["fields"]["status"]["name"].upper()
                    # get the project id from the webpage that corresponds to
                    # the Jira task (will be needed to invalidate the cache)
                    webpage = Webpage.query.filter_by(
                        id=task.webpage_id,
                    ).first()
                    if webpage and webpage.project_id not in project_ids:
                        project_ids.append(webpage.project_id)
            db.session.commit()

            # invalidate the cache for all the project trees where Jira tasks
            # have changed status
            for project_id in project_ids:
                project = Project.query.filter_by(id=project_id).first()
                if project:
                    site_repository = SiteRepository(project.name, app)
                    # clean the cache for a new Jira task to appear in the tree
                    site_repository.invalidate_cache()


@register_task(delay=1)
def scheduled_tasks_alert() -> None:
    """Run every second to test the task scheduler."""
    app = create_app()
    with app.app_context():
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = f"[ALERT][{timestamp}] Scheduled tasks running successfully."
        logger.debug(message)


@register_task(delay=PARSE_ASSETS_DELAY)
def parse_webpage_assets() -> None:
    """Parse webpage assets and update the database."""
    app = create_app()

    with app.app_context():
        app.logger.info("Running scheduled task: parse_webpage_assets")

        webpages = Webpage.query.all()
        if not webpages:
            return []

        assets = Asset.query.options(joinedload(Asset.webpages)).all()

        # Cache all existing webpages and assets for faster lookup
        webpages_ids = {w.id: w for w in webpages}
        existing_assets = {a.url: a for a in assets}
        assets_webpages_ids = set()

        for asset in assets:
            assets_webpages_ids.update(w.id for w in asset.webpages)

        # Delete orphan assets, i.e., which don't belong to any webpage
        # This will help keep the assets table size in check
        for asset in list(existing_assets.values()):
            if not any(
                webpage.id in webpages_ids for webpage in asset.webpages
            ):
                db.session.delete(asset)

        # Parse assets from files
        parsed_assets_data = []

        for webpage in webpages:
            if webpage.ext == ".dir" or not webpage.file_path:
                continue

            try:
                file_path = Path(BASE_DIR) / f"{webpage.file_path}"
                with open(file_path, "r") as f:
                    for line in f:
                        match = re.search(
                            r"https?://assets\.ubuntu\.com\/[^\"'()<>\?{}]+",
                            line,
                        )
                        if match:
                            asset_url = match.group(0)
                            asset_type = Path(asset_url).suffix
                            parsed_assets_data.append(
                                {
                                    "url": asset_url,
                                    "type": asset_type,
                                    "webpage_id": webpage.id,
                                }
                            )
            except Exception as e:
                app.logger.error(
                    f"Error parsing assets for webpage {webpage.id}: {e}",
                    exc_info=True,
                )

        # Process asset insertions and relationships
        for data in parsed_assets_data:
            key = data["url"]
            webpage_id = data["webpage_id"]
            webpage = webpages_ids.get(webpage_id)

            if not webpage:
                continue

            asset = existing_assets.get(key)

            if asset:
                if webpage.id not in assets_webpages_ids:
                    asset.webpages.append(webpage)
            else:
                asset = Asset(url=data["url"], type=data["type"])
                asset.webpages.append(webpage)
                db.session.add(asset)
                existing_assets[key] = asset

        db.session.commit()
        app.logger.info("Finished scheduled task: parse_webpage_assets")


def init_scheduled_tasks(app: Flask) -> None:
    @app.before_request
    def start_tasks():
        # only run this task once
        app.before_request_funcs[None].remove(start_tasks)
        update_jira_statuses()
        load_site_trees()
        parse_webpage_assets()
        scheduled_tasks_alert()
