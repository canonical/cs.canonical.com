"""add content_jira_id to webpage

Revision ID: b8bc4f2fc314
Revises: ac63c9eebbec
Create Date: 2025-06-02 11:17:01.443861

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b8bc4f2fc314'
down_revision = 'ac63c9eebbec'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "webpages", sa.Column("content_jira_id", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("webpages", "content_jira_id")
