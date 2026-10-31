@echo off
title RetinaScan MD — Stop Servers
color 0C
cd /d "%~dp0"

echo Stopping RetinaScan Backend (Port 8000) and Frontend (Port 5173)...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Killing Backend PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Killing Frontend PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Done! Both servers have been stopped.
timeout /t 3 >nul
exit /b 0

