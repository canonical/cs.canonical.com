"""add figma_link to webpage

Revision ID: 94be817851ab
Revises: a1ccbb13c228
Create Date: 2026-03-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '94be817851ab'
down_revision = 'a1ccbb13c228'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "webpages", sa.Column("figma_link", sa.String(), nullable=True)
    )


def downgrade():
    op.drop_column("webpages", "figma_link")
