"""Final commit

Revision ID: 23dff00498c7
Revises: a514c7f723fc
Create Date: 2025-05-16 03:29:03.840708

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '23dff00498c7'
down_revision = 'a514c7f723fc'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('expense', schema=None) as batch_op:
        batch_op.drop_constraint('expense_group_id_fkey', type_='foreignkey')
        batch_op.drop_column('group_id')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('expense', schema=None) as batch_op:
        batch_op.add_column(sa.Column('group_id', sa.INTEGER(), autoincrement=False, nullable=True))
        batch_op.create_foreign_key('expense_group_id_fkey', 'group', ['group_id'], ['id'])

    # ### end Alembic commands ###
