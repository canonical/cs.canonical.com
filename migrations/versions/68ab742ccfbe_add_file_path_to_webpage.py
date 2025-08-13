"""add file_path to webpage

Revision ID: 68ab742ccfbe
Revises: edb49aee1ab4
Create Date: 2025-08-12 13:28:36.390479

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '68ab742ccfbe'
down_revision = 'edb49aee1ab4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "webpages", sa.Column("file_path", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("webpages", "file_path")
