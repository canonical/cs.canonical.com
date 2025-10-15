import logging
import os
from datetime import datetime
from pathlib import Path
import re

import yaml
from flask import Flask

from webapp import create_app
from webapp.models import (
    Asset,
    JiraTask,
    JIRATaskStatus,
    JiraTaskType,
    Project,
    Webpage,
    WebpageStatus,
    db,
)
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

        # Fetch all JiraTasks
        jira_tasks = JiraTask.query.all()

        if jira_tasks:
            project_ids = set()

            # Collect all webpage_ids to batch load webpages
            webpage_ids = {
                task.webpage_id for task in jira_tasks if task.webpage_id
            }

            # Batch load all webpages in a single query
            webpages_dict = {}
            if webpage_ids:
                webpages = Webpage.query.filter(
                    Webpage.id.in_(webpage_ids)
                ).all()
                webpages_dict = {webpage.id: webpage for webpage in webpages}

            for task in jira_tasks:
                response = jira.get_issue_statuses(task.jira_id)
                new_status = response["fields"]["status"]["name"].upper()

                if task.status != new_status:
                    old_status = task.status
                    task.status = new_status

                    # Get webpage from the pre-loaded dictionary
                    webpage = webpages_dict.get(task.webpage_id)

                    # Handle webpage status sync for removal requests
                    if (
                        task.request_type == JiraTaskType.PAGE_REMOVAL
                        and old_status != JIRATaskStatus.REJECTED
                        and new_status == JIRATaskStatus.REJECTED
                    ):

                        # Update webpage status from TO_DELETE to AVAILABLE
                        # when removal request is rejected
                        if (
                            webpage
                            and webpage.status == WebpageStatus.TO_DELETE
                        ):
                            webpage.status = WebpageStatus.AVAILABLE
                            app.logger.info(
                                f"Updated webpage {webpage.id} status from "
                                "TO_DELETE to AVAILABLE due to rejected "
                                "removal request"
                            )

                    # Collect project IDs for cache invalidation
                    if webpage and webpage.project_id:
                        project_ids.add(webpage.project_id)

            db.session.commit()

            # Batch load all projects that need cache invalidation
            if project_ids:
                projects = Project.query.filter(
                    Project.id.in_(project_ids)
                ).all()

                # Invalidate cache for all affected project trees
                # where Jira tasks have changed status
                for project in projects:
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
