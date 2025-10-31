"""add owner to tasks

Revision ID: add_owner_to_tasks
Revises: 8b12c7db6e31
Create Date: 2025-10-30 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_owner_to_tasks'
down_revision = '20d3897d1f81'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('owner', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'owner')
