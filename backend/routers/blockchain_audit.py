from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.blockchain_block import BlockchainBlock
from models.user import User
from routers.auth import get_current_user, require_role
from services.blockchain_service import BlockchainService
import json

router = APIRouter()

@router.get("/blocks")
async def get_blocks(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(BlockchainBlock).order_by(BlockchainBlock.block_number.desc()).limit(limit).offset(offset)
    )
    blocks = result.scalars().all()
    
    return [{
        "id": b.id,
        "block_number": b.block_number,
        "previous_hash": b.previous_hash,
        "current_hash": b.current_hash,
        "merkle_root": b.merkle_root,
        "transaction_ids": json.loads(b.transaction_ids),
        "nonce": b.nonce,
        "timestamp": b.timestamp.isoformat(),
        "created_by": b.created_by,
        "verified": b.verified
    } for b in blocks]

@router.get("/verify")
async def verify_chain(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "auditor"))
):
    return await BlockchainService.verify_chain(db)

@router.get("/block/{block_number}")
async def get_block(
    block_number: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(BlockchainBlock).where(BlockchainBlock.block_number == block_number)
    )
    block = result.scalar_one_or_none()
    
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    return {
        "block_number": block.block_number,
        "previous_hash": block.previous_hash,
        "current_hash": block.current_hash,
        "merkle_root": block.merkle_root,
        "transaction_ids": json.loads(block.transaction_ids),
        "data": json.loads(block.data),
        "nonce": block.nonce,
        "timestamp": block.timestamp.isoformat(),
        "verified": block.verified
    }

@router.get("/stats")
async def get_chain_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import func
    result = await db.execute(
        select(
            func.count(BlockchainBlock.id).label('total_blocks'),
            func.max(BlockchainBlock.block_number).label('latest_block')
        )
    )
    row = result.first()
    
    return {
        "total_blocks": row.total_blocks or 0,
        "latest_block": row.latest_block or 0,
        "genesis_hash": BlockchainService.GENESIS_HASH[:16] + "...",
        "algorithm": "SHA-256 with Proof of Work",
        "difficulty": 2,
        "status": "OPERATIONAL"
    }