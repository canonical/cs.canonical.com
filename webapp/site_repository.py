import re
import subprocess
import time
import traceback
from collections.abc import Callable
from pathlib import Path
from typing import TypedDict

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import select

from webapp.helper import (
    convert_webpage_to_dict,
    get_or_create_project_id,
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
        try:
            self.invalidate_cache()
            # Update the cache
            if self.cache:
                self.cache.set(self.cache_key, tree)
        except Exception as e:
            self.logger.exception(traceback.format_exc())
            self.logger.error(f"Unable to save tree to cache: {e}")

    def invalidate_cache(self):
        self.cache.set(self.cache_key, None)

    def get_tree_from_disk(self):
        """Get a tree from a freshly cloned repository."""
        # Check if a background task is active. if so do not proceed
        if self.cache.get(
            f"{BACKGROUND_TASK_RUNNING_PREFIX}-{self.repository_uri}",
        ):
            return None

        github = self.app.config["github"]
        github.clone_repository(self.repository_uri)

        templates_folder = Path(self.repo_path + "/templates")
        templates_folder.mkdir(parents=True, exist_ok=True)

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

        if base_tree:
            # Save the tree metadata to the database and return an updated tree
            # that has all fields
            tree = self.create_webpages_for_tree(self.db, base_tree)
            self.sort_tree_by_page_name(tree)
            self.logger.info(f"Tree loaded for {self.repository_uri}")
            return tree
        return None

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

    # This method is called when an endpoint is called from FE to get the tree
    def get_tree_from_db(self):
        """Get the tree from the database. If the tree is incomplete, reload
        from the repository.
        """
        if project_id := get_or_create_project_id(self.repository_uri):
            webpages = (
                self.db.session.execute(
                    select(Webpage)
                    .where(
                        Webpage.project_id == project_id,
                    )
                    .where(Webpage.status != WebpageStatus.TO_DELETE),
                )
                .scalars()
                .all()
            )
            # build tree from repository in case DB table is empty
            if not webpages or self._has_incomplete_pages(webpages):
                tree = self.get_new_tree()
            # otherwise, build tree from DB
            else:
                tree = get_tree_struct(db.session, webpages)
                # If the tree is empty, load from the repository
                if not tree or (
                    not tree.get("children") and not tree.get("parent_id")
                ):
                    msg = (
                        "Reloading incomplete tree root "
                        f"{self.repository_uri}. {tree}"
                    )
                    self.logger.info(
                        msg,
                    )
                    tree = self.get_new_tree()
            return tree
        return None

    # This method is called from a scheduled task that clones repositories
    def get_tree(self):
        """Get a new tree from the repository"""

        new_tree = self.get_new_tree()
        self.set_tree_in_cache(new_tree)

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
        webpage.file_path = node["file_path"]
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

    def create_webpages_for_tree(self, db: SQLAlchemy, tree: Tree):
        """Create webpages for each node in the tree."""
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

        db.session.commit()
        return webpage_dict

    def get_tree_sync(self, no_cache: bool = False):
        """Try to get the tree from the cache, database or repository."""
        # First try to get the tree from the cache
        if not no_cache and (tree := self.get_tree_from_cache()):
            return tree

        self.logger.info(f"Loading {self.repository_uri} from database")

        # Load the tree from database
        if tree := self.get_tree_from_db():
            self.logger.info(
                f"Tree obtained from db for {self.repository_uri}"
            )
            self.set_tree_in_cache(tree)
            return tree

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
