from sqlalchemy import String, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base
from datetime import datetime

class BlockchainBlock(Base):
    __tablename__ = "blockchain_blocks"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    block_number: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    previous_hash: Mapped[str] = mapped_column(String(255))
    current_hash: Mapped[str] = mapped_column(String(255), unique=True)
    merkle_root: Mapped[str] = mapped_column(String(255))
    transaction_ids: Mapped[str] = mapped_column(Text)  # JSON array of transaction IDs
    data: Mapped[str] = mapped_column(Text)  # JSON encoded block data
    nonce: Mapped[int] = mapped_column(Integer, default=0)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[int] = mapped_column(Integer)
    verified: Mapped[bool] = mapped_column(default=True)