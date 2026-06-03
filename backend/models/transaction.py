from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime
import enum

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("budget_categories.id"))
    allocation_id: Mapped[int | None] = mapped_column(ForeignKey("budget_allocations.id"), nullable=True)
    transaction_type: Mapped[str] = mapped_column(String(10))  # income, expense
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(Text)
    payee_payer: Mapped[str] = mapped_column(String(200))
    voucher_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    or_number: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Official Receipt
    transaction_date: Mapped[datetime] = mapped_column(DateTime)
    fiscal_year: Mapped[int] = mapped_column(Integer)
    quarter: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, approved, rejected
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    blockchain_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    block_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)