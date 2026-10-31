@echo off
title RetinaScan MD — One-Click Project Launcher (SIC - AI803)
color 0B

:: Always switch to the project root directory (works even from a Desktop shortcut)
cd /d "%~dp0"

echo ============================================================================
echo   RetinaScan MD — Diabetic Retinopathy Clinical AI Workstation (SIC - AI803)
echo ============================================================================
echo.

:: Verify Python virtual environment exists
if not exist "backend\.venv\Scripts\python.exe" (
    echo [ERROR] Python virtual environment not found at backend\.venv\Scripts\python.exe
    pause
    exit /b 1
)

:: Verify frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies first...
    pushd frontend
    call npm install
    popd
)

echo [1/3] Starting FastAPI AI Backend Server (3 Models + Grad-CAM + LLM) on Port 8000...
start "RetinaScan - FastAPI Backend (Port 8000)" cmd /k "cd /d "%~dp0backend" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

echo [2/3] Starting React + Vite Frontend Server on Port 5173...
start "RetinaScan - React Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

echo [3/3] Waiting 5 seconds for servers to warm up before opening browser...
timeout /t 5 /nobreak >nul

echo Opening http://127.0.0.1:5173 in your default browser...
start "" "http://127.0.0.1:5173"

echo.
echo ============================================================================
echo   Project is now running!
echo   - Frontend UI:      http://127.0.0.1:5173
echo   - Backend API Docs: http://127.0.0.1:8000/docs
echo.
echo   Keep the two server terminal windows open while using the app.
echo   To stop everything at once, double-click stop_project.bat.
echo ============================================================================
timeout /t 4 >nul
exit /b 0

