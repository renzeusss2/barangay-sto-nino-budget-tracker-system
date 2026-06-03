from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract
from database import get_db, IS_SQLITE
from models.transaction import Transaction
from models.budget import BudgetCategory
from models.user import User
from routers.auth import get_current_user
from datetime import datetime

router = APIRouter()

def month_expr(col):
    """SQLite uses strftime, PostgreSQL uses extract."""
    if IS_SQLITE:
        return func.strftime('%m', col)
    return func.to_char(col, 'MM')

@router.get("/income-expense/{fiscal_year}")
async def income_expense_report(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(
            month_expr(Transaction.transaction_date).label('month'),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label('total')
        )
        .where(and_(Transaction.fiscal_year == fiscal_year, Transaction.status == "approved"))
        .group_by('month', Transaction.transaction_type)
        .order_by('month')
    )

    monthly_data = {}
    for row in result.all():
        m = int(row.month)
        if m not in monthly_data:
            monthly_data[m] = {"month": m, "income": 0, "expense": 0}
        monthly_data[m][row.transaction_type] = float(row.total)

    months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    return {
        "fiscal_year": fiscal_year,
        "monthly": [
            {**v, "month_name": months[v["month"]], "net": v["income"] - v["expense"]}
            for v in sorted(monthly_data.values(), key=lambda x: x["month"])
        ]
    }

@router.get("/category-breakdown/{fiscal_year}")
async def category_breakdown(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(
            BudgetCategory.name,
            BudgetCategory.code,
            BudgetCategory.color,
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        )
        .join(BudgetCategory, Transaction.category_id == BudgetCategory.id)
        .where(and_(
            Transaction.fiscal_year == fiscal_year,
            Transaction.transaction_type == "expense",
            Transaction.status == "approved"
        ))
        .group_by(BudgetCategory.id, BudgetCategory.name, BudgetCategory.code, BudgetCategory.color)
    )

    rows = result.all()
    total_all = sum(float(r.total) for r in rows)

    return {
        "fiscal_year": fiscal_year,
        "categories": [
            {
                "name": r.name, "code": r.code, "color": r.color,
                "total": float(r.total), "count": r.count,
                "percentage": round(float(r.total) / total_all * 100, 2) if total_all > 0 else 0
            }
            for r in rows
        ],
        "total": total_all
    }