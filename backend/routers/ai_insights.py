from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.ai_insights_service import AIInsightsService

router = APIRouter()

@router.get("/forecast/{fiscal_year}")
async def get_forecast(
    fiscal_year: int,
    months_ahead: int = 3,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await AIInsightsService.get_spending_forecast(db, fiscal_year, months_ahead)

@router.get("/utilization/{fiscal_year}")
async def get_utilization(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await AIInsightsService.get_budget_utilization_analysis(db, fiscal_year)

@router.get("/anomalies/{fiscal_year}")
async def get_anomalies(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await AIInsightsService.detect_spending_anomalies(db, fiscal_year)

@router.get("/recommendations/{fiscal_year}")
async def get_recommendations(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    recs = await AIInsightsService.generate_recommendations(db, fiscal_year)
    return {"fiscal_year": fiscal_year, "recommendations": recs}

@router.get("/dashboard/{fiscal_year}")
async def get_ai_dashboard(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    forecast = await AIInsightsService.get_spending_forecast(db, fiscal_year)
    utilization = await AIInsightsService.get_budget_utilization_analysis(db, fiscal_year)
    anomalies = await AIInsightsService.detect_spending_anomalies(db, fiscal_year)
    recommendations = await AIInsightsService.generate_recommendations(db, fiscal_year)
    
    return {
        "fiscal_year": fiscal_year,
        "forecast": forecast,
        "utilization": utilization,
        "anomalies": anomalies,
        "recommendations": recommendations
    }