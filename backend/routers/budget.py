from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from database import get_db
from models.budget import BudgetCategory, BudgetAllocation
from routers.auth import get_current_user, require_role
from models.user import User
from datetime import datetime

router = APIRouter()

class AllocationCreate(BaseModel):
    category_id: int
    fiscal_year: int
    quarter: Optional[int] = None
    allocated_amount: float
    description: Optional[str] = None

class AllocationUpdate(BaseModel):
    allocated_amount: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(BudgetCategory).where(BudgetCategory.is_active == True))
    cats = result.scalars().all()
    return [{"id": c.id, "name": c.name, "code": c.code, 
             "description": c.description, "color": c.color} for c in cats]

@router.get("/allocations")
async def get_allocations(
    fiscal_year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(BudgetAllocation, BudgetCategory).join(
        BudgetCategory, BudgetAllocation.category_id == BudgetCategory.id
    )
    if fiscal_year:
        query = query.where(BudgetAllocation.fiscal_year == fiscal_year)
    
    result = await db.execute(query.order_by(BudgetAllocation.id.desc()))
    rows = result.all()
    
    return [{
        "id": alloc.id,
        "category_id": alloc.category_id,
        "category_name": cat.name,
        "category_code": cat.code,
        "category_color": cat.color,
        "fiscal_year": alloc.fiscal_year,
        "quarter": alloc.quarter,
        "allocated_amount": alloc.allocated_amount,
        "description": alloc.description,
        "status": alloc.status,
        "created_at": alloc.created_at.isoformat(),
        "created_by": alloc.created_by
    } for alloc, cat in rows]

@router.post("/allocations")
async def create_allocation(
    data: AllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "treasurer"))
):
    allocation = BudgetAllocation(
        category_id=data.category_id,
        fiscal_year=data.fiscal_year,
        quarter=data.quarter,
        allocated_amount=data.allocated_amount,
        description=data.description,
        created_by=current_user.id,
        status="draft"
    )
    db.add(allocation)
    await db.commit()
    await db.refresh(allocation)
    
    return {"id": allocation.id, "message": "Budget allocation created successfully",
            "allocated_amount": allocation.allocated_amount}

@router.put("/allocations/{allocation_id}")
async def update_allocation(
    allocation_id: int,
    data: AllocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "treasurer"))
):
    result = await db.execute(select(BudgetAllocation).where(BudgetAllocation.id == allocation_id))
    allocation = result.scalar_one_or_none()
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    if data.allocated_amount is not None:
        allocation.allocated_amount = data.allocated_amount
    if data.description is not None:
        allocation.description = data.description
    if data.status is not None:
        allocation.status = data.status
        if data.status == "approved":
            allocation.approved_by = current_user.id
    
    allocation.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Allocation updated", "id": allocation_id}

@router.get("/summary/{fiscal_year}")
async def get_budget_summary(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(
            func.sum(BudgetAllocation.allocated_amount).label("total_allocated"),
            func.count(BudgetAllocation.id).label("total_allocations")
        ).where(BudgetAllocation.fiscal_year == fiscal_year)
    )
    row = result.first()
    
    return {
        "fiscal_year": fiscal_year,
        "total_allocated": float(row.total_allocated or 0),
        "total_allocations": row.total_allocations or 0
    }