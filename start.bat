@echo off
title Amdox Technologies - AI-Powered ERP Suite Launcher

echo ===================================================
echo   AMX-ERP-2026-04 Suite Local Startup Manager
echo ===================================================
echo.

:: 1. Start ML Demand Forecasting Service
echo [1/3] Starting Python ML forecasting service in a new window...
start "Amdox ML Demand Forecaster [Port 8000]" cmd /k "cd apps\ml-service && .\.venv\Scripts\python.exe main.py"

:: 2. Start Compiled NestJS API Gateway
echo [2/3] Starting Compiled NestJS API Gateway in a new window...
set APP_PORT=4005
set FRONTEND_URL=http://localhost:5173
start "Amdox NestJS API Gateway [Port 4005]" cmd /k "set APP_PORT=4005 && set FRONTEND_URL=http://localhost:5173 && node apps\api\dist\main.js"

:: 3. Start React Vite Frontend Application
echo [3/3] Starting Vite Web Client in a new window...
start "Amdox ERP Frontend Client [Port 5173]" cmd /k "npm.cmd run dev --prefix apps\web"

echo.
echo ===================================================
echo   All services have been initialized!
echo   - Web Client:   http://localhost:5173
echo   - API Swagger:  http://localhost:4005/api-docs
echo   - ML Service:   http://localhost:8000/docs
echo ===================================================
echo.
pause
