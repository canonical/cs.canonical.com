"""Add ext to webpages

Revision ID: 2e86822886aa
Revises: ac63c9eebbec
Create Date: 2025-06-03 11:38:42.644973

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2e86822886aa'
down_revision = 'ac63c9eebbec'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "webpages", sa.Column("ext", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("webpages", "ext")
