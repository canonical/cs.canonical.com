"""add mattermost field to users table

Revision ID: 0ab7839e4412
Revises: 14729444f282
Create Date: 2026-02-11 08:02:08.687117

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0ab7839e4412'
down_revision = '14729444f282'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users", sa.Column("mattermost", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("users", "mattermost")
