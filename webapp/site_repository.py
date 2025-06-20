import os
import re
import subprocess
import time
from collections.abc import Callable
from pathlib import Path
from typing import TypedDict

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import delete, select

from webapp.helper import (
    convert_webpage_to_dict,
    get_project_id,
    get_tree_struct,
)
from webapp.models import (
    Project,
    User,
    Webpage,
    WebpageStatus,
    db,
    get_or_create,
)
from webapp.parse_tree import scan_directory

BACKGROUND_TASK_RUNNING_PREFIX = "BACKGROUND_TASK_RUNNING"


class SiteRepositoryError(Exception):
    """Exception raised for errors in the SiteRepository class"""


class Tree(TypedDict):
    name: str
    title: str
    description: str
    link: str
    children: list


class SiteRepository:
    # Directory to clone repositories
    CACHE_KEY_PREFIX = "SITE_REPOSITORY"

    db: SQLAlchemy = db

    def __init__(
        self,
        repository_uri: str,
        app: Flask,
        branch="main",
        db: SQLAlchemy = None,
    ):
        base_dir = app.config["BASE_DIR"]
        self.REPOSITORY_DIRECTORY = f"{base_dir}/repositories"
        self.repository_uri = repository_uri
        self.cache_key = f"{self.CACHE_KEY_PREFIX}_{repository_uri}_{branch}"
        self.branch = branch
        self.app = app
        self.logger = app.logger
        self.cache = app.config["CACHE"]
        self.repo_path = self.get_repo_path(repository_uri)

        # If a database is provided, use it
        if db:
            self.db = db

    def __str__(self) -> str:
        return f"SiteRepository({self.repository_uri}, {self.branch})"

    def get_repo_path(self, repository_uri: str):
        """Get the repository path"""
        return (
            self.REPOSITORY_DIRECTORY
            + "/"
            + (repository_uri.strip("/").split("/")[-1].removesuffix(".git"))
        )

    def __exec__(self, command_str: str):
        """Execute a command and return the output"""
        command = command_str.strip("").split(" ")
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        # Wait for the process to finish
        process.wait()
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            raise OSError(f"Execution Error: {stderr.decode('utf-8')}")
        return stdout.decode("utf-8")

    def __decorate_errors__(self, func: Callable, msg: str):
        """Decorator to catch Exceptions and raise SiteRepositoryError"""

        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Silently ignore "directory already exists" errors
                if re.search(r"destination path (.*) already exists", str(e)):
                    return 0
                raise SiteRepositoryError(f"{msg}: {e}")

        return wrapper

    def __sanitize_command__(self, command_str: str):
        """Sanitize the command string"""
        command_str = command_str.strip()
        return re.sub(r"[(\;\|\|\&|\n)]|", "", command_str)

    def __run__(self, command_str: str, msg="Error executing command: "):
        """Execute a sanitized command"""
        self.logger.info(
            f"exec: {command_str}",
        )
        command_str = self.__sanitize_command__(command_str)
        return self.__decorate_errors__(self.__exec__, msg)(command_str)

    def delete_local_files(self):
        """Delete a local folder"""
        return self.__run__(
            f"rm -rf {self.repo_path}",
            f"Error deleting folder {self.repo_path}",
        )

    def setup_site_repository(self):
        """Clone the repository to a specific directory, or checkout the latest
        updates if the repository exists.
        """
        # Download files from the repository
        github = self.app.config["github"]
        github.get_repository_tree(
            repository=self.repository_uri,
            branch=self.branch,
        )

    def repository_exists(self):
        """Check if the repository exists"""
        absolute_path = (
            self.app.config["BASE_DIR"]
            + "/repositories/"
            + self.repository_uri
            + "/.git"
        )
        return os.path.exists(absolute_path)

    def get_tree_from_cache(self):
        """Get the tree from the cache. Return None if cache is not
        available.
        """
        if self.cache:
            return self.cache.get(self.cache_key)

    def set_tree_in_cache(self, tree):
        """Set the tree in the cache. Silently pass if cache is not
        available.
        """
        if self.cache:
            return self.cache.set(self.cache_key, tree)

    def invalidate_cache(self):
        self.cache.set(self.cache_key, None)

    def get_tree_from_disk(self):
        """Get a tree from a freshly cloned repository."""
        # Setup the repository
        self.setup_site_repository()

        templates_folder = Path(self.repo_path + "/templates")
        templates_folder.mkdir(parents=True, exist_ok=True)

        # Check if a background task is active. if so, wait until it completes
        # with a timeout of 30s
        for _ in range(6):
            # We sleep first to give the download a chance to complete
            time.sleep(5)
            if not self.cache.get(
                f"{BACKGROUND_TASK_RUNNING_PREFIX}-{self.repository_uri}",
            ):
                break

        # Parse the templates, retry if a page is unavailable, as it might
        # still be being downloaded.
        retries = 5
        while retries > 0:
            try:
                tree = scan_directory(str(templates_folder.absolute()))
                break
            except Exception as e:
                retries -= 1
                if retries == 0:
                    raise SiteRepositoryError(f"Error scanning directory: {e}")
                time.sleep(1)
                continue

        return tree

    def get_new_tree(self):
        """Get the tree from the repository, update the cache and save to the
        database.

        """
        # Generate the base tree from the repository
        base_tree = self.get_tree_from_disk()

        # Save the tree metadata to the database and return an updated tree
        # that has all fields
        tree = self.create_webpages_for_tree(self.db, base_tree)
        self.sort_tree_by_page_name(tree)
        self.logger.info(f"Tree loaded for {self.repository_uri}")
        return tree

    def sort_tree_by_page_name(self, tree):
        if "children" in tree:
            tree["children"].sort(key=lambda p: p["name"].rsplit("/", 1)[-1])
            for child in tree["children"]:
                self.sort_tree_by_page_name(child)

    def _has_incomplete_pages(self, webpages) -> bool:
        """At times, the tree might not be fully loaded at the point when saved
        to the database. This function returns whether a page is invalid.
        """
        for webpage in webpages:
            children = (
                self.db.session.execute(
                    select(Webpage).where(
                        Webpage.parent_id == webpage.id,
                    ),
                )
                .scalars()
                .all()
            )
            if (webpage.parent_id and not (webpage.name or webpage.title)) or (
                not webpage.parent_id and not children
            ):
                self.logger.warning(f"Page {webpage.id} is incomplete.")
                return True
        return False

    def get_tree_from_db(self):
        """Get the tree from the database. If the tree is incomplete, reload
        from the repository.
        """
        webpages = (
            self.db.session.execute(
                select(Webpage).where(
                    Webpage.project_id == get_project_id(self.repository_uri),
                ),
            )
            .scalars()
            .all()
        )
        # build tree from repository in case DB table is empty
        # TODO: Revert this line to `if not webpages ...` 
        # before merging this PR
        # This is only for QA
        if True or not webpages or self._has_incomplete_pages(webpages):
            tree = self.get_new_tree()
        # otherwise, build tree from DB
        else:
            tree = get_tree_struct(db.session, webpages)
            # If the tree is empty, load from the repository
            if not tree.get("children") and not tree.get("parent_id"):
                self.logger.info(
                    f"Reloading incomplete tree root {self.repository_uri}.",
                )
                tree = self.get_new_tree()
        return tree

    def get_tree(self, no_cache: bool = False):
        """Get the tree from the cache or load a new tree to cache and db."""
        # Return from cache if available
        if (not no_cache) and (tree := self.get_tree_from_cache()):
            return tree

        self.invalidate_cache()
        return self.get_new_tree()

    def __create_webpage_for_node__(
        self,
        db: SQLAlchemy,
        node: dict,
        project: Project,
        owner: User,
        parent_id: int,
    ):
        """Create a webpage from a node in the tree."""
        # Get a webpage for this name and project, or create a new one
        webpage, created = get_or_create(
            db.session,
            Webpage,
            name=node["name"],
            url=node["name"],
            project_id=project.id,
            commit=False,
        )

        # If instance is new, update the owner and project fields
        if created:
            webpage.owner_id = owner.id
            webpage.project_id = project.id

        # Update the fields
        webpage.title = node["title"]
        webpage.description = node["description"]
        webpage.copy_doc_link = node["link"]
        webpage.parent_id = parent_id
        webpage.ext = node["ext"]
        if webpage.status == WebpageStatus.NEW:
            webpage.status = WebpageStatus.AVAILABLE

        db.session.add(webpage)
        db.session.flush()

        webpage_dict = convert_webpage_to_dict(webpage, owner, project)

        # Return a dict with the webpage fields
        return {**node, **webpage_dict}

    def __create_webpages_for_children__(
        self,
        db,
        children,
        project,
        owner,
        parent_id,
    ):
        """Recursively create webpages for each child in the tree."""
        for child in children:
            # Create a webpage for the root node
            webpage_dict = self.__create_webpage_for_node__(
                db,
                child,
                project,
                owner,
                parent_id,
            )
            # Update the child node with the webpage fields
            child.update(webpage_dict)
            if child.get("children"):
                # Create webpages for the children recursively
                self.__create_webpages_for_children__(
                    db,
                    child["children"],
                    project,
                    owner,
                    webpage_dict["id"],
                )

    def __remove_webpages_to_delete__(self, db, tree):
        # convert tree of pages from repository to list
        webpages = []
        self.add_pages_to_list(tree, webpages)

        webpages_to_delete = db.session.execute(
            select(Webpage).where(Webpage.status == WebpageStatus.TO_DELETE),
        )

        for row in webpages_to_delete:
            page_to_delete = row[0]
            # Delete pages which aren't in the tree, but don't delete pages
            # which have associated Jira tasks
            if (
                page_to_delete.name not in webpages
                and len(page_to_delete.jira_tasks) == 0
            ):
                db.session.execute(
                    delete(Webpage).where(Webpage.id == page_to_delete.id),
                )

    def create_webpages_for_tree(self, db: SQLAlchemy, tree: Tree):
        """Create webpages for each node in the tree."""
        self.logger.info(f"Existing tree {tree}")
        # Get the default project and owner for new webpages
        project, _ = get_or_create(
            db.session,
            Project,
            name=self.repository_uri,
        )
        owner, _ = get_or_create(db.session, User, name="Default")

        # Create a webpage for the root node
        webpage_dict = self.__create_webpage_for_node__(
            db,
            tree,
            project,
            owner,
            None,
        )

        # Create webpages for the children recursively
        self.__create_webpages_for_children__(
            db,
            webpage_dict["children"],
            project,
            owner,
            webpage_dict["id"],
        )

        # Remove pages that don't exist in the repository anymore
        self.__remove_webpages_to_delete__(db, tree)

        self.logger.info(f"Existing dict {webpage_dict}")

        db.session.commit()
        return webpage_dict

    def get_tree_sync(self, no_cache: bool = False):
        """Try to get the tree from the cache, database or repository."""
        # First try to get the tree from the cache
        if not no_cache and (tree := self.get_tree_from_cache()):
            return tree

        self.logger.info(f"Loading {self.repository_uri} from database")
        self.invalidate_cache()

        # Load the tree from database
        try:
            tree = self.get_tree_from_db()
            self.logger.info(f"Tree refreshed for {self.repository_uri}")
            # Update the cache
            self.set_tree_in_cache(tree)
            return tree
        except Exception as e:
            self.logger.error(f"Error loading tree: {e}")

        # Or just return an empty tree
        return {
            "name": "",
            "title": "",
            "description": "",
            "copy_doc_link": "",
            "children": [],
        }

    def add_pages_to_list(self, tree, page_list: list):
        # Append root node name
        page_list.append(tree["name"])
        for child in tree["children"]:
            page_list.append(child["name"])
            # If child nodes exist, add their names to the list
            if child.get("children"):
                self.add_pages_to_list(child, page_list)
