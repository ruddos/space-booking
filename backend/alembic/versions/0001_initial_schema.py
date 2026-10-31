"""initial_enterprise_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-31 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from models import Base

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Применяет создание всех таблиц через метаданные SQLAlchemy
    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    # Удаляет все таблицы
    bind = op.get_bind()
    Base.metadata.drop_all(bind)
