import base64
import contextlib
import os
from binascii import Error
from os import environ


def get_flask_env(key: str, default=None) -> str:
    """Return the value of KEY or FLASK_KEY."""
    return environ.get(key, environ.get(f"FLASK_{key}", default))


# Try to decode the private key from base64 before using it
if private_key := get_flask_env("GOOGLE_PRIVATE_KEY"):
    with contextlib.suppress(Error):
        private_key = base64.b64decode(private_key).replace(b"\\n", b"\n")

REDIS_HOST = get_flask_env("REDIS_HOST")
REDIS_PORT = get_flask_env("REDIS_PORT", 6379)
REDIS_DB_CONNECT_STRING = (
    f"redis://{REDIS_HOST}:{REDIS_PORT}/0"
    if REDIS_HOST
    else get_flask_env("REDIS_DB_CONNECT_STRING")
)
RABBITMQ_URI = environ.get("RABBITMQ_URI")
DIRECTORY_API_TOKEN = get_flask_env("DIRECTORY_API_TOKEN")
REPO_ORG = get_flask_env("REPO_ORG", "https://github.com/canonical")
GH_TOKEN = get_flask_env("GH_TOKEN", "")
SECRET_KEY = get_flask_env("SECRET_KEY")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLALCHEMY_DATABASE_URI = get_flask_env(
    "POSTGRESQL_DB_CONNECT_STRING",
    get_flask_env("DATABASE_URL", "sqlite:///project.db"),
)
JIRA_EMAIL = get_flask_env("JIRA_EMAIL")
JIRA_TOKEN = get_flask_env("JIRA_TOKEN")
JIRA_URL = get_flask_env("JIRA_URL")
JIRA_LABELS = get_flask_env("JIRA_LABELS")
JIRA_COPY_UPDATES_EPIC = get_flask_env("JIRA_COPY_UPDATES_EPIC")
GOOGLE_DRIVE_FOLDER_ID = get_flask_env("GOOGLE_DRIVE_FOLDER_ID")
COPYDOC_TEMPLATE_ID = get_flask_env("COPYDOC_TEMPLATE_ID")
GOOGLE_CREDENTIALS = {
    "type": "service_account",
    "project_id": "web-engineering-436014",
    "private_key_id": get_flask_env("GOOGLE_PRIVATE_KEY_ID"),
    "private_key": private_key,
    "client_email": "websites-copy-docs-627@web-engineering-436014.iam.gserviceaccount.com",  # noqa: E501
    "client_id": "116847960229506342511",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": (
        "https://www.googleapis.com/oauth2/v1/certs"
    ),
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/websites-copy-docs-627%40web-engineering-436014.iam.gserviceaccount.com",  # noqa: E501
    "universe_domain": "googleapis.com",
}
FLASK_DEBUG = get_flask_env("FLASK_DEBUG", False)
JIRA_REPORTER_ID = get_flask_env("JIRA_REPORTER_ID")
DISABLE_SSO = get_flask_env("DISABLE_SSO", False)
SITES_MAINTENANCE_EPIC = get_flask_env("SITES_MAINTENANCE_EPIC", "KAN-2")
SITES_MAINTENANCE_LABELS = get_flask_env(
    "SITES_MAINTENANCE_LABELS", "sites_Maintenance"
)
SITES_NEW_FEATURES_LABELS = get_flask_env(
    "SITES_NEW_FEATURES_LABELS", "sites_NewFeature"
)

# CSRF Protection Configuration
WTF_CSRF_ENABLED = True
WTF_CSRF_TIME_LIMIT = None  # No time limit for token validity
WTF_CSRF_SSL_STRICT = not FLASK_DEBUG  # Enforce HTTPS in production
WTF_CSRF_METHODS = ["POST", "PUT", "PATCH", "DELETE"]
# Use session cookie for CSRF token instead of generating per-form tokens
SESSION_COOKIE_SECURE = not FLASK_DEBUG  # HTTPS only in production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
