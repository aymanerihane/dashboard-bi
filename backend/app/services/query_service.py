from sqlalchemy.orm import Session
from app.models.query import Query
from app.schemas.query import QueryCreate, QueryResponse
from app.core.database import get_db

class QueryService:
    def __init__(self, db: Session):
        self.db = db

    def create_query(self, query_data: QueryCreate) -> QueryResponse:
        query = Query(**query_data.dict())
        self.db.add(query)
        self.db.commit()
        self.db.refresh(query)
        return QueryResponse.from_orm(query)

    def get_query(self, query_id: int) -> QueryResponse:
        query = self.db.query(Query).filter(Query.id == query_id).first()
        if not query:
            return None
        return QueryResponse.from_orm(query)

    def get_all_queries(self) -> list[QueryResponse]:
        queries = self.db.query(Query).all()
        return [QueryResponse.from_orm(query) for query in queries]

    def delete_query(self, query_id: int) -> bool:
        query = self.db.query(Query).filter(Query.id == query_id).first()
        if not query:
            return False
        self.db.delete(query)
        self.db.commit()
        return True

def get_query_service(db: Session = Depends(get_db)) -> QueryService:
    return QueryService(db)