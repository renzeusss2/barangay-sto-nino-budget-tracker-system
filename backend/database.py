from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
import os

# ─── Load .env if present ───────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─── Database URL Configuration ─────────────────────────────────────────────────
# Development: sqlite+aiosqlite:///./barangay_budget.db  (default)
# Production:  Set DATABASE_URL in .env or environment
#
# PostgreSQL format:
#   postgresql+asyncpg://user:password@localhost:5432/barangay_budget
#
# Railway/Supabase/Neon format:
#   postgresql://user:password@host:5432/dbname
#   → auto-converted to postgresql+asyncpg:// below

_raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./barangay_budget.db")

# Auto-fix Railway/Heroku/Supabase postgres:// URLs
if _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgresql://") and "asyncpg" not in _raw_url:
    _raw_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = _raw_url
IS_SQLITE = DATABASE_URL.startswith("sqlite")

# ─── Engine ──────────────────────────────────────────────────────────────────────
if IS_SQLITE:
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=300,
    )

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

# ─── Init DB ─────────────────────────────────────────────────────────────────────
async def init_db():
    from models.user import User
    from models.budget import BudgetCategory, BudgetAllocation
    from models.transaction import Transaction
    from models.blockchain_block import BlockchainBlock

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

async def seed_initial_data(session: AsyncSession):
    from models.user import User
    from models.budget import BudgetCategory
    from sqlalchemy import select
    import hashlib

    result = await session.execute(select(User).where(User.username == "admin"))
    if result.scalar_one_or_none():
        return

    # Only the initial system administrator account is seeded.
    # All other users must register via the /api/auth/register endpoint.
    # IMPORTANT: Change this password immediately after first login via the
    # admin panel or by using the Forgot Password flow.
    initial_password = os.getenv("INITIAL_ADMIN_PASSWORD", "ChangeMe@2024!")
    users = [
        User(username="admin", email=os.getenv("ADMIN_EMAIL", "admin@barangay-sto-nino.gov.ph"),
             hashed_password=hashlib.sha256(initial_password.encode()).hexdigest(),
             full_name="System Administrator", role="admin", is_active=True),
    ]

    categories = [
        BudgetCategory(name="Personnel Services",                    code="PS",    description="Salaries, wages, and personnel benefits",          color="#3B82F6"),
        BudgetCategory(name="Maintenance & Other Operating Expenses", code="MOOE",  description="Office supplies, utilities, repairs",              color="#10B981"),
        BudgetCategory(name="Capital Outlay",                        code="CO",    description="Equipment, infrastructure, and major improvements", color="#F59E0B"),
        BudgetCategory(name="Social Services",                       code="SS",    description="Health, education, and welfare programs",           color="#EF4444"),
        BudgetCategory(name="Infrastructure",                        code="INFRA", description="Roads, drainage, and public facilities",            color="#8B5CF6"),
        BudgetCategory(name="Disaster Risk Reduction",               code="DRRM",  description="Calamity fund and disaster preparedness",           color="#EC4899"),
        BudgetCategory(name="Peace & Order",                         code="PO",    description="Barangay tanod and security",                       color="#06B6D4"),
        BudgetCategory(name="Environmental Programs",                code="ENV",   description="Waste management and green initiatives",            color="#84CC16"),
        BudgetCategory(name="Others",                                code="OTH",   description="Miscellaneous and other expenses",                  color="#94a3b8"
),
    ]

    for u in users:    session.add(u)
    for c in categories: session.add(c)
    await session.commit()
    print(f"✅ Database seeded ({'PostgreSQL' if not IS_SQLITE else 'SQLite'})")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()