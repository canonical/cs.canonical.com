"""adding_request_type_to_jira_task_model

Revision ID: ac63c9eebbec
Revises: 636e244e00ea
Create Date: 2025-03-03 10:20:25.627491

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "ac63c9eebbec"
down_revision = "636e244e00ea"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "jira_tasks", sa.Column("request_type", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("jira_tasks", "request_type")
