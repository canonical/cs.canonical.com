"""add launchpad_id to users table

Revision ID: a1ccbb13c228
Revises: 0ab7839e4412
Create Date: 2026-02-19 06:02:08.747728

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1ccbb13c228'
down_revision = '0ab7839e4412'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users", sa.Column("launchpad_id", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("users", "launchpad_id")
