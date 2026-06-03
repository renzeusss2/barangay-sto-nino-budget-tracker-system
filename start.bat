@echo off
echo.
echo ==============================================
echo   Barangay Sto. Nino Budget Tracking System
echo   Starting all services...
echo ==============================================
echo.

echo [1/2] Starting FastAPI backend on port 8000...
cd backend
start "Backend - FastAPI" cmd /k "pip install -r requirements.txt && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
cd ..

echo Waiting 4 seconds for backend to start...
timeout /t 4 /nobreak >nul

echo [2/2] Starting React frontend on port 3000...
cd frontend
start "Frontend - React" cmd /k "npm install && npm run dev"
cd ..

echo.
echo ==============================================
echo   System is starting!
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   Demo Accounts:
echo   - admin     / Admin@2024
echo   - treasurer / Treasurer@2024
echo   - auditor   / Auditor@2024
echo   - official  / Official@2024
echo ==============================================
echo.
pause
