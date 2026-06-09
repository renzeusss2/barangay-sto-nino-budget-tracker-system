import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db
from routers import auth, budget, transactions, reports, ai_insights, blockchain_audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Barangay Sto. Niño Budget Tracking System",
    description="AI-Powered & Blockchain-Based Budget Management",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
        "https://barangay-sto-nino-budget-tracker-system-2vrf0uju4.vercel.app",
        "https://barangay-sto-nino-budget-tracker-system.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# ── ROUTES ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,            prefix="/api/auth",       tags=["Authentication"])
app.include_router(budget.router,          prefix="/api/budget",     tags=["Budget"])
app.include_router(transactions.router,    prefix="/api/transactions",tags=["Transactions"])
app.include_router(reports.router,         prefix="/api/reports",    tags=["Reports"])
app.include_router(ai_insights.router,     prefix="/api/ai",         tags=["AI Insights"])
app.include_router(blockchain_audit.router,prefix="/api/blockchain", tags=["Blockchain Audit"])

@app.get("/")
async def root():
    return {"message": "Barangay Sto. Niño Budget System API", "status": "operational"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "system": "Barangay Budget Tracking System"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)