"""Added role column to users table

Revision ID: 14729444f282
Revises: 1b6109065dba
Create Date: 2025-08-26 17:15:11.023451

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "14729444f282"
down_revision = "1b6109065dba"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("role", sa.String(), default="user"))


def downgrade():
    op.drop_column("users", "role")
