from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Query(Base):
    __tablename__ = 'queries'

    id = Column(Integer, primary_key=True, index=True)
    sql_query = Column(Text, nullable=False)
    executed_at = Column(String, nullable=False)
    execution_time = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True)  # Assuming a user can execute queries

    def __repr__(self):
        return f"<Query(id={self.id}, sql_query={self.sql_query}, executed_at={self.executed_at}, execution_time={self.execution_time}, user_id={self.user_id})>"