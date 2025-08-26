from fastapi import APIRouter, HTTPException, Depends
from app.schemas.query import QueryRequest, QueryResponse
from app.services.query_service import QueryService
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/execute", response_model=QueryResponse)
async def execute_query(query_request: QueryRequest, current_user: str = Depends(get_current_user)):
    try:
        result = await QueryService.execute_query(query_request.query)
        return QueryResponse(result=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))