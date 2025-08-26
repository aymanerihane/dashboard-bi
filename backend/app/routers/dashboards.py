from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db, Dashboard as DBDashboard, User
from app.schemas import DashboardCreate, DashboardUpdate, Dashboard
from app.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Dashboard])
async def list_dashboards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dashboards = db.query(DBDashboard).filter(DBDashboard.user_id == current_user.id).all()
    return dashboards

@router.post("/", response_model=Dashboard)
async def create_dashboard(
    dashboard: DashboardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_dashboard = DBDashboard(
        user_id=current_user.id,
        name=dashboard.name,
        description=dashboard.description,
        charts=[chart.dict() for chart in dashboard.charts]
    )
    
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    
    return db_dashboard

@router.get("/{dashboard_id}", response_model=Dashboard)
async def get_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dashboard = db.query(DBDashboard).filter(
        DBDashboard.id == dashboard_id,
        DBDashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    return dashboard

@router.put("/{dashboard_id}", response_model=Dashboard)
async def update_dashboard(
    dashboard_id: int,
    dashboard_update: DashboardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dashboard = db.query(DBDashboard).filter(
        DBDashboard.id == dashboard_id,
        DBDashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    update_data = dashboard_update.dict(exclude_unset=True)
    
    # Convert charts to dict if provided
    if "charts" in update_data and update_data["charts"]:
        update_data["charts"] = [chart.dict() for chart in update_data["charts"]]
    
    for field, value in update_data.items():
        setattr(dashboard, field, value)
    
    db.commit()
    db.refresh(dashboard)
    
    return dashboard

@router.delete("/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dashboard = db.query(DBDashboard).filter(
        DBDashboard.id == dashboard_id,
        DBDashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    db.delete(dashboard)
    db.commit()
    
    return {"message": "Dashboard deleted successfully"}
