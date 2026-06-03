import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models.blockchain_block import BlockchainBlock
from models.transaction import Transaction

class BlockchainService:
    """
    Simplified blockchain implementation for audit trail.
    Each block contains transaction data with cryptographic linking.
    """
    
    GENESIS_HASH = "0" * 64
    
    @staticmethod
    def compute_hash(data: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of block data"""
        block_string = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(block_string.encode()).hexdigest()
    
    @staticmethod
    def compute_merkle_root(transaction_ids: List[int]) -> str:
        """Compute Merkle root of transactions"""
        if not transaction_ids:
            return "0" * 64
        
        hashes = [hashlib.sha256(str(tid).encode()).hexdigest() for tid in transaction_ids]
        
        while len(hashes) > 1:
            if len(hashes) % 2 != 0:
                hashes.append(hashes[-1])
            hashes = [
                hashlib.sha256((hashes[i] + hashes[i+1]).encode()).hexdigest()
                for i in range(0, len(hashes), 2)
            ]
        
        return hashes[0]
    
    @staticmethod
    def mine_block(block_data: Dict, difficulty: int = 2) -> tuple[str, int]:
        """Simple proof-of-work mining"""
        nonce = 0
        prefix = "0" * difficulty
        
        while True:
            block_data["nonce"] = nonce
            block_hash = BlockchainService.compute_hash(block_data)
            if block_hash.startswith(prefix):
                return block_hash, nonce
            nonce += 1
            if nonce > 10000:  # Cap for performance in government systems
                return block_hash, nonce
    
    @classmethod
    async def create_block(
        cls,
        session: AsyncSession,
        transaction_ids: List[int],
        transaction_data: List[Dict],
        created_by: int
    ) -> BlockchainBlock:
        """Create a new block in the chain"""
        
        # Get latest block number and hash
        result = await session.execute(
            select(BlockchainBlock).order_by(BlockchainBlock.block_number.desc()).limit(1)
        )
        last_block = result.scalar_one_or_none()
        
        block_number = (last_block.block_number + 1) if last_block else 1
        previous_hash = last_block.current_hash if last_block else cls.GENESIS_HASH
        
        merkle_root = cls.compute_merkle_root(transaction_ids)
        timestamp = datetime.utcnow()
        
        block_data = {
            "block_number": block_number,
            "previous_hash": previous_hash,
            "merkle_root": merkle_root,
            "transaction_ids": transaction_ids,
            "transactions": transaction_data,
            "timestamp": str(timestamp),
            "created_by": created_by,
        }
        
        current_hash, nonce = cls.mine_block(block_data)
        
        block = BlockchainBlock(
            block_number=block_number,
            previous_hash=previous_hash,
            current_hash=current_hash,
            merkle_root=merkle_root,
            transaction_ids=json.dumps(transaction_ids),
            data=json.dumps(block_data, default=str),
            nonce=nonce,
            timestamp=timestamp,
            created_by=created_by,
            verified=True
        )
        
        session.add(block)
        await session.commit()
        await session.refresh(block)
        
        return block
    
    @classmethod
    async def verify_chain(cls, session: AsyncSession) -> Dict[str, Any]:
        """Verify the integrity of the entire blockchain"""
        result = await session.execute(
            select(BlockchainBlock).order_by(BlockchainBlock.block_number.asc())
        )
        blocks = result.scalars().all()
        
        if not blocks:
            return {"valid": True, "blocks_checked": 0, "issues": []}
        
        issues = []
        previous_hash = cls.GENESIS_HASH
        
        for block in blocks:
            # Check hash linkage
            if block.previous_hash != previous_hash:
                issues.append({
                    "block": block.block_number,
                    "issue": "Hash chain broken - previous_hash mismatch",
                    "severity": "critical"
                })
            
            # Verify block hash
            block_data = json.loads(block.data)
            block_data["nonce"] = block.nonce
            recomputed_hash = cls.compute_hash(block_data)
            
            if recomputed_hash != block.current_hash:
                issues.append({
                    "block": block.block_number,
                    "issue": "Block hash invalid - data may have been tampered",
                    "severity": "critical"
                })
            
            previous_hash = block.current_hash
        
        return {
            "valid": len(issues) == 0,
            "blocks_checked": len(blocks),
            "issues": issues,
            "chain_integrity": "INTACT" if len(issues) == 0 else "COMPROMISED",
            "last_block": blocks[-1].block_number if blocks else 0,
            "verified_at": datetime.utcnow().isoformat()
        }
    
    @classmethod
    async def add_transaction_to_chain(
        cls,
        session: AsyncSession,
        transaction: Transaction,
        created_by: int
    ) -> str:
        """Add a single transaction to blockchain and return hash"""
        
        tx_data = {
            "id": transaction.id,
            "reference_number": transaction.reference_number,
            "transaction_type": transaction.transaction_type,
            "amount": transaction.amount,
            "category_id": transaction.category_id,
            "description": transaction.description,
            "payee_payer": transaction.payee_payer,
            "transaction_date": str(transaction.transaction_date),
            "fiscal_year": transaction.fiscal_year,
            "quarter": transaction.quarter,
            "status": transaction.status,
            "created_by": transaction.created_by,
            "timestamp": str(datetime.utcnow())
        }
        
        block = await cls.create_block(
            session,
            [transaction.id],
            [tx_data],
            created_by
        )
        
        return block.current_hash, block.block_number