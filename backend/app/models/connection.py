from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    host = Column(String, index=True)
    port = Column(Integer)
    username = Column(String)
    password = Column(String)
    database_name = Column(String)

    # Relationships can be defined here if needed
    # For example, if you have a User model and want to link connections to users
    # user_id = Column(Integer, ForeignKey('users.id'))
    # user = relationship("User", back_populates="connections")