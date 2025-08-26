from sqlalchemy.orm import Session
from app.models.connection import Connection
from app.models.query import Query
from app.schemas.connection import ConnectionCreate, ConnectionUpdate
from app.schemas.query import QueryCreate, QueryResponse
from app.core.database import get_db

class DatabaseService:
    def __init__(self, db: Session):
        self.db = db

    def create_connection(self, connection_data: ConnectionCreate) -> Connection:
        new_connection = Connection(**connection_data.dict())
        self.db.add(new_connection)
        self.db.commit()
        self.db.refresh(new_connection)
        return new_connection

    def update_connection(self, connection_id: int, connection_data: ConnectionUpdate) -> Connection:
        connection = self.db.query(Connection).filter(Connection.id == connection_id).first()
        if connection:
            for key, value in connection_data.dict(exclude_unset=True).items():
                setattr(connection, key, value)
            self.db.commit()
            self.db.refresh(connection)
            return connection
        return None

    def delete_connection(self, connection_id: int) -> bool:
        connection = self.db.query(Connection).filter(Connection.id == connection_id).first()
        if connection:
            self.db.delete(connection)
            self.db.commit()
            return True
        return False

    def execute_query(self, query_data: QueryCreate) -> QueryResponse:
        # Logic to execute the SQL query and log it
        executed_query = Query(**query_data.dict())
        self.db.add(executed_query)
        self.db.commit()
        self.db.refresh(executed_query)
        return QueryResponse.from_orm(executed_query)

    def get_all_connections(self):
        return self.db.query(Connection).all()

    def get_connection_by_id(self, connection_id: int) -> Connection:
        return self.db.query(Connection).filter(Connection.id == connection_id).first()