# 🏛️ Barangay Sto. Niño Budget Tracking System
**AI-Powered & Blockchain-Based | Parañaque City, Metro Manila**

---

## ⚡ QUICK START (Most Common Fix)

The login "invalid credentials" error means the **backend is not running**.
You need TWO terminals open at the same time.

---

## 📋 REQUIREMENTS

Make sure these are installed first:
- **Python 3.10+** → https://python.org/downloads
- **Node.js 18+** → https://nodejs.org
- **pip** (comes with Python)

---

## 🚀 HOW TO RUN

### Windows (Double-click)
```
Double-click: start.bat
```

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

### Manual (if scripts don't work)

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

Then open: **http://localhost:3000**

---

## 🔑 DEMO ACCOUNTS

| Role      | Username    | Password        | Permissions |
|-----------|-------------|-----------------|-------------|
| Admin     | admin       | Admin@2024      | Full access |
| Treasurer | treasurer   | Treasurer@2024  | Create transactions, manage budget |
| Auditor   | auditor     | Auditor@2024    | Approve/reject, view blockchain |
| Official  | official    | Official@2024   | View only |

---

## 🔧 TROUBLESHOOTING

### "Invalid credentials" / Login not working
→ Your **backend is not running**. Open a terminal, go to `backend/`, run:
```bash
python -m uvicorn main:app --port 8000 --reload
```

### "Cannot connect to server" error
→ Same fix. Backend must be on port 8000.

### Frontend shows blank page
→ Make sure `npm install` was run inside the `frontend/` folder.

### Database issues / reset
→ Delete `backend/barangay_budget.db` and restart the backend. It will recreate with fresh seed data.

### Port already in use
```bash
# Kill port 8000
lsof -ti:8000 | xargs kill -9   # Mac/Linux
netstat -ano | findstr :8000     # Windows (find PID then: taskkill /PID xxxx /F)
```

---

## 🌐 URLs

| Service    | URL                          |
|------------|------------------------------|
| Frontend   | http://localhost:3000        |
| Backend    | http://localhost:8000        |
| API Docs   | http://localhost:8000/docs   |
| API Health | http://localhost:8000/health |

---

## 🏗️ SYSTEM ARCHITECTURE

```
barangay-budget-system/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point + CORS
│   ├── database.py             # SQLite DB + seeding
│   ├── models/
│   │   ├── user.py             # User accounts
│   │   ├── budget.py           # Categories & allocations
│   │   ├── transaction.py      # Financial transactions
│   │   └── blockchain_block.py # Blockchain blocks
│   ├── routers/
│   │   ├── auth.py             # Login, JWT tokens
│   │   ├── budget.py           # Budget CRUD
│   │   ├── transactions.py     # Transaction CRUD + approval
│   │   ├── reports.py          # Financial reports
│   │   ├── ai_insights.py      # AI endpoints
│   │   └── blockchain_audit.py # Blockchain endpoints
│   └── services/
│       ├── blockchain_service.py    # SHA-256 chain logic
│       └── ai_insights_service.py  # Forecasting + anomaly detection
│
└── frontend/                   # React + Vite frontend
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
        │   └── Layout.jsx          # Sidebar + navigation
        ├── contexts/
        │   └── AuthContext.jsx     # Login state
        └── utils/
            └── api.js              # All API calls
```

---

## ✨ FEATURES

| Feature | Description |
|---|---|
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
