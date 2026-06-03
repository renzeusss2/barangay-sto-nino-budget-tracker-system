from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime

class BudgetCategory(Base):
    __tablename__ = "budget_categories"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(10), default="#3B82F6")
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("budget_categories.id"))
    fiscal_year: Mapped[int] = mapped_column(Integer)
    quarter: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-4 or None for annual
    allocated_amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")  # draft, approved, active
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)