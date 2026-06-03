from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import Optional
from database import get_db
from models.transaction import Transaction
from models.budget import BudgetCategory
from models.user import User
from routers.auth import get_current_user, require_role
from services.blockchain_service import BlockchainService
from datetime import datetime
import uuid

router = APIRouter()

class TransactionCreate(BaseModel):
    category_id: int
    transaction_type: str  # income or expense
    amount: float
    description: str
    payee_payer: str
    voucher_number: Optional[str] = None
    or_number: Optional[str] = None
    transaction_date: datetime
    fiscal_year: int
    quarter: int
    notes: Optional[str] = None

class TransactionApprove(BaseModel):
    action: str  # approve or reject
    notes: Optional[str] = None

@router.get("/")
async def list_transactions(
    fiscal_year: Optional[int] = None,
    quarter: Optional[int] = None,
    category_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction, BudgetCategory).join(
        BudgetCategory, Transaction.category_id == BudgetCategory.id
    )
    
    if fiscal_year:
        query = query.where(Transaction.fiscal_year == fiscal_year)
    if quarter:
        query = query.where(Transaction.quarter == quarter)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
    if status:
        query = query.where(Transaction.status == status)
    if search:
        query = query.where(or_(
            Transaction.description.contains(search),
            Transaction.payee_payer.contains(search),
            Transaction.reference_number.contains(search)
        ))
    
    total_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = total_result.scalar()
    
    query = query.order_by(Transaction.transaction_date.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.all()
    
    transactions = []
    for tx, cat in rows:
        transactions.append({
            "id": tx.id,
            "reference_number": tx.reference_number,
            "category_id": tx.category_id,
            "category_name": cat.name,
            "category_code": cat.code,
            "category_color": cat.color,
            "transaction_type": tx.transaction_type,
            "amount": tx.amount,
            "description": tx.description,
            "payee_payer": tx.payee_payer,
            "voucher_number": tx.voucher_number,
            "or_number": tx.or_number,
            "transaction_date": tx.transaction_date.isoformat(),
            "fiscal_year": tx.fiscal_year,
            "quarter": tx.quarter,
            "status": tx.status,
            "blockchain_hash": tx.blockchain_hash,
            "block_number": tx.block_number,
            "created_by": tx.created_by,
            "notes": tx.notes,
            "created_at": tx.created_at.isoformat()
        })
    
    return {"transactions": transactions, "total": total, "limit": limit, "offset": offset}

@router.post("/")
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "treasurer"))
):
    ref_number = f"TXN-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    transaction = Transaction(
        reference_number=ref_number,
        category_id=data.category_id,
        transaction_type=data.transaction_type,
        amount=data.amount,
        description=data.description,
        payee_payer=data.payee_payer,
        voucher_number=data.voucher_number,
        or_number=data.or_number,
        transaction_date=data.transaction_date,
        fiscal_year=data.fiscal_year,
        quarter=data.quarter,
        notes=data.notes,
        status="pending",
        created_by=current_user.id
    )
    
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    return {
        "id": transaction.id,
        "reference_number": transaction.reference_number,
        "message": "Transaction created successfully. Awaiting approval.",
        "status": "pending"
    }

@router.put("/{transaction_id}/approve")
async def approve_transaction(
    transaction_id: int,
    data: TransactionApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "auditor"))
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if transaction.status != "pending":
        raise HTTPException(status_code=400, detail=f"Transaction is already {transaction.status}")
    
    transaction.status = data.action  # "approved" or "rejected"
    transaction.approved_by = current_user.id
    if data.notes:
        transaction.notes = (transaction.notes or "") + f"\n[{data.action.upper()}] {data.notes}"
    
    # Add to blockchain if approved
    if data.action == "approved":
        try:
            block_hash, block_number = await BlockchainService.add_transaction_to_chain(
                db, transaction, current_user.id
            )
            transaction.blockchain_hash = block_hash
            transaction.block_number = block_number
        except Exception as e:
            print(f"Blockchain error: {e}")
    
    transaction.updated_at = datetime.utcnow()
    await db.commit()
    
    return {
        "message": f"Transaction {data.action} successfully",
        "transaction_id": transaction_id,
        "blockchain_hash": transaction.blockchain_hash,
        "block_number": transaction.block_number
    }

@router.get("/summary/{fiscal_year}")
async def get_transaction_summary(
    fiscal_year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total income
    income_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.fiscal_year == fiscal_year,
                 Transaction.transaction_type == "income",
                 Transaction.status == "approved")
        )
    )
    
    # Total expenses
    expense_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            and_(Transaction.fiscal_year == fiscal_year,
                 Transaction.transaction_type == "expense",
                 Transaction.status == "approved")
        )
    )
    
    # Pending transactions
    pending_result = await db.execute(
        select(func.count(Transaction.id)).where(
            and_(Transaction.fiscal_year == fiscal_year,
                 Transaction.status == "pending")
        )
    )
    
    total_income = float(income_result.scalar() or 0)
    total_expense = float(expense_result.scalar() or 0)
    pending_count = pending_result.scalar() or 0
    
    return {
        "fiscal_year": fiscal_year,
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": total_income - total_expense,
        "pending_transactions": pending_count,
        "generated_at": datetime.utcnow().isoformat()
    }