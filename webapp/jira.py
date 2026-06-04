from __future__ import annotations

import json
import threading
import time
from datetime import datetime

from flask import request
import redis
import requests

from webapp.helper import RequestType
from webapp.models import User, db


class JiraError(Exception):
    pass


class Jira:
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    EPIC = "10000"
    SUBTASK = "10013"
    BUG = "10015"

    REDIS_TOKEN_KEY = "JIRA_OAUTH_TOKEN"
    REDIS_CLOUD_ID_KEY = "JIRA_CLOUD_ID"

    _token_lock = threading.Lock()

    def __init__(
        self,
        url: str,
        client_id: str,
        client_secret: str,
        labels: str,
        copy_updates_epic: str,
        sites_maintenance_epic: str,
        redis_url: str = None,
    ):
        """
        Initialize the Jira object.

        Args:
            url (str): The URL of the Jira instance.
            client_id (str): The client ID of the Jira application.
            client_secret (str): The client secret of the Jira application.
            labels (str): The labels to be applied to the created issues.
            copy_updates_epic (str): The key of the epic to copy updates to.
            sites_maintenance_epic (str): The key of the epic for sites
                maintenance.
            redis_url (str): Redis connection URL for shared token caching.
        """
        self.url = url
        self.labels = labels
        self.client_id = client_id
        self.client_secret = client_secret
        self.copy_updates_epic = copy_updates_epic
        self.sites_maintenance_epic = sites_maintenance_epic
        self._redis = redis.from_url(redis_url) if redis_url else None
        self._cloud_id = None
        self._access_token = None
        self._expires_at = 0
        self._connect()

    def __request__(
        self, method: str, path: str, data: dict = {}, params: dict = {}
    ):
        if data:
            data = json.dumps(data)
        session = self.get_jira_client()
        base = "https://api.atlassian.com/ex/jira"
        url = f"{base}/{self._cloud_id}/rest/api/3/{path}"
        response = session.request(
            method,
            url,
            data=data,
            headers=self.headers,
            params=params,
        )

        if response.status_code == 200 or response.status_code == 201:
            return response.json()
        elif response.status_code == 204:
            return {
                "status_code": 204,
                "response": "No content",
            }

        raise Exception(
            "Failed to make a request to Jira. Status code:"
            f" {path} {method} {data} {params}"
            f" {response.status_code}. Response: {response.text}"
        )

    def _connect(self):
        """
        Connect to Jira API and obtain access token, then resolve the cloud ID.
        """
        self.get_jira_client()

    def _resolve_cloud_id(self, access_token: str) -> str:
        """
        Resolve the Atlassian cloud ID for the configured Jira site.

        OAuth 2.0 tokens require API calls to go through
        https://api.atlassian.com/ex/jira/{cloudId}/rest/api/3/...
        """
        # Check Redis first
        if self._redis:
            cached = self._redis.get(self.REDIS_CLOUD_ID_KEY)
            if cached:
                return cached.decode()

        response = requests.get(
            "https://api.atlassian.com/oauth/token/accessible-resources",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if response.status_code != 200:
            raise JiraError(
                "Failed to fetch accessible resources. "
                f"Status: {response.status_code}, Response: {response.text}"
            )

        resources = response.json()
        # Match the configured JIRA_URL to find the correct cloud ID
        for resource in resources:
            if resource["url"].rstrip("/") == self.url.rstrip("/"):
                cloud_id = resource["id"]
                # Cloud ID doesn't change - cache indefinitely
                if self._redis:
                    self._redis.set(self.REDIS_CLOUD_ID_KEY, cloud_id)
                return cloud_id

        raise JiraError(
            f"Could not find cloud ID for Jira site: {self.url}. "
            f"Accessible sites: {[r['url'] for r in resources]}"
        )

    def _get_cached_token(self):
        """Try to load a valid token from Redis.

        Returns:
            dict: Token data with 'access_token' and 'expires_at' keys,
                or None if no valid cached token exists.
        """
        if not self._redis:
            return None
        cached = self._redis.get(self.REDIS_TOKEN_KEY)
        if not cached:
            return None
        data = json.loads(cached)
        # Ensure it's not within the expiry buffer
        if int(time.time()) < (data["expires_at"] - 300):
            return data
        return None

    def _store_token(self, token_data: dict):
        """Store token in Redis with a TTL matching its lifetime.

        Args:
            token_data (dict): Token data containing 'access_token'
                and 'expires_at' keys.
        """
        if not self._redis:
            return
        ttl = token_data["expires_at"] - int(time.time())
        if ttl > 0:
            self._redis.setex(
                self.REDIS_TOKEN_KEY, ttl, json.dumps(token_data)
            )

    def get_jira_client(self):
        """Get an authenticated requests session for the Jira API.

        Resolves a valid access token using a three-tier strategy:
        1. Local in-memory cache (fast path, no I/O).
        2. Redis shared cache (avoids redundant OAuth calls across workers).
        3. Fresh OAuth token fetch (last resort).

        Returns:
            requests.Session: A session with the Authorization header set.
        """
        current_time = int(time.time())
        buffer_seconds = 300  # 5-minute proactive buffer

        # Fast path: use local in-memory cache
        if self._access_token and current_time < (
            self._expires_at - buffer_seconds
        ):
            session = requests.Session()
            session.headers.update(
                {"Authorization": f"Bearer {self._access_token}"}
            )
            return session

        with self._token_lock:
            # Double-check after acquiring the lock
            current_time = int(time.time())
            if self._access_token and current_time < (
                self._expires_at - buffer_seconds
            ):
                session = requests.Session()
                session.headers.update(
                    {"Authorization": f"Bearer {self._access_token}"}
                )
                return session

            # Try Redis shared cache
            token_data = self._get_cached_token()
            if token_data:
                self._access_token = token_data["access_token"]
                self._expires_at = token_data["expires_at"]
            else:
                # Fetch a brand new token
                token_data = self.fetch_new_access_token()
                self._access_token = token_data["access_token"]
                self._expires_at = token_data["expires_at"]
                self._store_token(token_data)

            # Resolve cloud ID (cached in Redis indefinitely)
            if not self._cloud_id:
                self._cloud_id = self._resolve_cloud_id(self._access_token)

        session = requests.Session()
        session.headers.update(
            {"Authorization": f"Bearer {self._access_token}"}
        )
        return session

    def fetch_new_access_token(self):
        """Fetch a new access token from Atlassian using client credentials.

        Returns:
            dict: Token data with 'access_token' and 'expires_at' keys.

        Raises:
            JiraError: If the token request fails.
        """
        token_url = "https://auth.atlassian.com/oauth/token"

        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        # Request a brand new access token using your M2M credentials
        response = requests.post(token_url, data=data, headers=headers)

        if response.status_code != 200:
            raise JiraError(
                "Authentication failed. Unable to obtain access token."
            )

        response_data = response.json()
        return {
            "access_token": response_data["access_token"],
            "expires_at": int(time.time()) + response_data["expires_in"],
        }

    def get_reporter_jira_id(self, user_id):
        """
        Get the Jira ID of the user who reported the issue.

        Args:
            user_id (int): The ID of the user who reported the issue.

        Returns:
            str: The Jira ID of the user who reported the issue.
        """
        # Try to get the user from the database
        if jira_reporter_id := request.headers.get("X-JIRA-REPORTER-ID"):
            return jira_reporter_id
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        # If the user already has a Jira account ID, return it
        if user.jira_account_id:
            return user.jira_account_id
        # Otherwise get it from jira
        jira_user = self.find_user(user.email)
        if not jira_user:
            raise ValueError(f"User with email {user.email} not found in Jira")
        # Update the user in the database
        user.jira_account_id = jira_user[0]["accountId"]
        db.session.commit()
        return jira_user[0]["accountId"]

    def find_user(self, query: str):
        """
        Find a user based on a query.

        Args:
            query (str): The query string to search for a user.

        Returns:
            dict: A dictionary containing the user information.
        """
        return self.__request__(
            method="GET",
            path="user/search",
            params={"query": query},
        )

    def create_task(
        self,
        summary: str,
        issue_type: int,
        description: str,
        parent: str,
        reporter_jira_id: str,
        due_date: datetime,
        labels: list[str] = None,
        custom_fields: dict = {},
    ):
        """
        Creates a task or subtask in Jira.

        Args:
            summary (str): The summary of the task.
            issue_type (int): The ID of the issue type for the task.
            description (str): The description of the task.
            parent (str): The key of the parent issue. If None, the task will
                be created without a parent.
            reporter_jira_id (str): The ID of the reporter of the task.
            due_date (datetime): The due date of the task.

        Returns:
            dict: The response from the Jira API containing information about
                the created task.
        """
        if parent:
            parent = {"key": parent}

        payload = {
            "fields": {
                "description": {
                    "content": [
                        {
                            "content": [
                                {
                                    "text": description,
                                    "type": "text",
                                }
                            ],
                            "type": "paragraph",
                        }
                    ],
                    "type": "doc",
                    "version": 1,
                },
                "summary": summary,
                "issuetype": {"id": issue_type},
                "labels": labels if (labels and len(labels)) else self.labels,
                "reporter": {"id": reporter_jira_id},
                "parent": parent,
                "duedate": due_date,
                "project": {"id": "10492"},  # Web and Design-ENG
                "components": [
                    {"id": "12655"},  # Sites Tribe
                ],
            },
            "update": {},
        }

        if custom_fields:
            for key, value in custom_fields.items():
                payload["fields"][key] = value

        return self.__request__(method="POST", path="issue", data=payload)

    def create_issue(
        self,
        request_type: int,
        description: str,
        reporter_id: str,
        due_date: datetime,
        summary: str,
    ):
        """Creates a new issue in Jira.

        Args:
            request_type (int): The type of the request. 0 for Epic, 1 or 2 for
                Task.
            description (str): The description of the issue.
            reporter_id (str): The ID of the reporter.
            due_date (datetime): The due date of the issue.

        Returns:
            dict: The response from the Jira API.
        """

        # Get the reporter ID
        reporter_jira_id = self.get_reporter_jira_id(reporter_id)

        # Create the issue depending on the request type
        if (
            request_type == RequestType.NEW_WEBPAGE.value
            or request_type == RequestType.PAGE_REFRESH.value
        ):
            # Create epic
            epic = self.create_task(
                summary=summary,
                issue_type=self.EPIC,
                description=description,
                parent=None,
                reporter_jira_id=reporter_jira_id,
                due_date=due_date,
            )

            if not epic:
                raise Exception("Failed to create epic")

            # Create subtasks for this epic
            for subtask_name in ["UX", "Visual", "Dev"]:
                self.create_task(
                    summary=f"{subtask_name} - {summary}",
                    issue_type=self.SUBTASK,
                    description=description,
                    parent=epic["key"],
                    reporter_jira_id=reporter_jira_id,
                    due_date=due_date,
                )
            return epic

        return self.create_task(
            summary=summary,
            issue_type=self.SUBTASK,
            description=description,
            parent=self.copy_updates_epic,
            reporter_jira_id=reporter_jira_id,
            due_date=due_date,
        )

    def change_issue_status(self, issue_id: str, transition_id: str) -> bool:
        """Change the status of a Jira issue.

        Args:
            issue_id (str): The ID of the Jira issue (e.g., "JIRA-123").
            transition_id (str): Transition_ID for the desired status.

        Returns:
            Bool: True if status was changed successfully else False.
        """
        payload = {
            "transition": {"id": transition_id},
        }
        return self.__request__(
            method="POST",
            path=f"/issue/{issue_id}/transitions",
            data=payload,
        )

    def get_issue_statuses(self, jira_id: str):
        """Get the statuses of the Jira issues.

        Returns:
            dict: The statuses of the Jira issues.
        """
        return self.__request__(
            method="GET",
            path=f"issue/{jira_id}?fields=status",
        )

    def bulk_change_issue_status(self, payload) -> bool:
        """Change the status of a Jira issue.

        Args:
            payload: The payload to be sent to the Jira API.

        Returns:
            Bool: True if bulk operation was successful else False.
        """
        return self.__request__(
            method="POST",
            path="bulk/issues/transition",
            data=payload,
        )

    def unlink_parent_issue(self, issue_id: str) -> bool:
        """Remove the parent from a Jira issue.

        Args:
            issue_id (str): The ID of the Jira issue (e.g., "JIRA-123").

        Returns:
            Bool: True if parent was removed successfully else False.
        """
        payload = {
            "fields": {"parent": None},
        }
        return self.__request__(
            method="PUT",
            path=f"issue/{issue_id}",
            data=payload,
        )

    def link_copydoc_with_content_page(self, copydoc, jira_id):
        """Link a copydoc with a content page in Jira.

        Args:
            copydoc (str): The URL of the copydoc.
            jira_id (str): The ID of the Jira issue.

        Returns:
            dict: The response from the Jira API.
        """

        payload = {
            "fields": {
                # TODO: Update the field ID when switching to
                # real Content Team project in Jira
                "customfield_11133": copydoc,
            },
        }

        return self.__request__(
            method="PUT", path=f"issue/{jira_id}", data=payload
        )

    def get_issue_assignee(self, jira_id: str):
        """Get the assignee of a Jira issue.

        Args:
            jira_id (str): The ID of the Jira issue.

        Returns:
            dict: The assignee of the Jira issue.
        """
        return self.__request__(
            method="GET",
            path=f"issue/{jira_id}?fields=assignee",
        )


def init_jira(app):
    try:
        app.config["JIRA"] = Jira(
            url=app.config["JIRA_URL"],
            client_id=app.config["JIRA_CLIENT_ID"],
            client_secret=app.config["JIRA_CLIENT_SECRET"],
            labels=app.config["JIRA_LABELS"].split(","),
            copy_updates_epic=app.config["JIRA_COPY_UPDATES_EPIC"],
            sites_maintenance_epic=app.config.get("SITES_MAINTENANCE_EPIC"),
            redis_url=app.config.get("REDIS_DB_CONNECT_STRING"),
        )
    except Exception as error:
        app.logger.info(f"Unable to initialize jira: {error}")
