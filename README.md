# 🏛️ Barangay Sto. Niño Budget Tracking System
**AI-Powered & Blockchain-Based | Parañaque City, Metro Manila**

---

## 🌐 LIVE DEPLOYMENT

| Service | URL |
|---------|-----|
| 🖥️ Frontend (Vercel) | https://barangay-sto-nino-budget-tracker-sy.vercel.app |
| ⚙️ Backend (Railway) | https://barangay-sto-nino-budget-tracker-system-production.up.railway.app |
| 📖 API Docs | https://barangay-sto-nino-budget-tracker-system-production.up.railway.app/docs |
| ❤️ API Health | https://barangay-sto-nino-budget-tracker-system-production.up.railway.app/health |

---

## 🔑 DEMO ACCOUNTS

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Admin | admin | Admin@2024 | Full access |
| Treasurer | treasurer | Treasurer@2024 | Create transactions, manage budget |
| Auditor | auditor | Auditor@2024 | Approve/reject, view blockchain |
| Official | official | Official@2024 | View only |

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite → Vercel |
| Backend | FastAPI + Python → Railway |
| Database | SQLite (aiosqlite) |
| Auth | JWT (python-jose) |
| Email | Resend API |
| Blockchain | SHA-256 (custom implementation) |
| AI | Linear regression + Z-score analysis |

---

## ⚡ LOCAL DEVELOPMENT

### Requirements
- **Python 3.10+** → https://python.org/downloads
- **Node.js 18+** → https://nodejs.org

### Windows
```
Double-click: start.bat
```

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual

**Terminal 1 — Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:3000**

---

## 🏗️ SYSTEM ARCHITECTURE

```
barangay_budget_system/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # App entry point + CORS
│   ├── database.py                 # SQLite DB + seeding
│   ├── models/
│   │   ├── user.py                 # User accounts
│   │   ├── budget.py               # Categories & allocations
│   │   ├── transaction.py          # Financial transactions
│   │   └── blockchain_block.py     # Blockchain blocks
│   ├── routers/
│   │   ├── auth.py                 # Login, JWT tokens
│   │   ├── budget.py               # Budget CRUD
│   │   ├── transactions.py         # Transaction CRUD + approval
│   │   ├── reports.py              # Financial reports
│   │   ├── ai_insights.py          # AI endpoints
│   │   └── blockchain_audit.py     # Blockchain endpoints
│   └── services/
│       ├── blockchain_service.py   # SHA-256 chain logic
│       └── ai_insights_service.py  # AI forecasting + anomaly detection
│
└── frontend/                       # React + Vite frontend
    └── src/
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── TransactionsPage.jsx
        │   ├── BudgetPage.jsx
        │   ├── ReportsPage.jsx
        │   ├── AIInsightsPage.jsx
        │   └── BlockchainPage.jsx
        ├── components/
        │   └── Layout.jsx
        ├── contexts/
        │   └── AuthContext.jsx
        └── utils/
            └── api.js
```

---

## ✨ FEATURES

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Real-time income/expense charts, recent transactions |
| 💸 Transactions | Create, approve/reject with blockchain recording |
| 💰 Budget | Allocate funds by category and quarter |
| 📈 Reports | Monthly charts, category breakdown, trends |
| 🤖 AI Insights | Spending forecast, anomaly detection, recommendations |
| 🔗 Blockchain | SHA-256 audit trail, chain verification, block explorer |
| 👥 User Roles | Admin, Treasurer, Auditor, Official |

---

## 🔗 BLOCKCHAIN AUDIT TRAIL

Every **approved** transaction is:
1. Serialized into a data block
2. Hashed with SHA-256 (with Proof-of-Work)
3. Linked to the previous block's hash
4. Stored permanently with Merkle root

Tampering with any transaction breaks the hash chain — instantly detectable.

---

## 🤖 AI FEATURES

- **Spending Forecast** — Linear regression + moving average to predict next 3 months
- **Anomaly Detection** — Z-score statistical analysis flags unusual transactions
- **Budget Utilization** — Per-category burn rate with status alerts
- **Recommendations** — Auto-generated action items based on budget patterns

---

## 🔧 TROUBLESHOOTING

### "Invalid credentials" / Login not working
→ Backend is not running. Run:
```bash
cd backend
python -m uvicorn main:app --port 8000 --reload
```

### "Cannot connect to server"
→ Same fix — backend must be on port 8000.

### Frontend shows blank page
→ Run `npm install` inside `frontend/` folder.

### Reset database
→ Delete `backend/barangay_budget.db` and restart backend. Fresh seed data will be created automatically.