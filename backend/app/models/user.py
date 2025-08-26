from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, index=True)
    disabled = Column(Integer, default=0)  # 0 for active, 1 for disabled

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email}, full_name={self.full_name}, disabled={self.disabled})>"