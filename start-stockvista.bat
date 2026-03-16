@echo off
setlocal

set "ROOT=%~dp0"

echo Launching StockVista...
start "StockVista Backend" cmd /k ""%ROOT%run-backend.bat""
start "StockVista Frontend" cmd /k ""%ROOT%run-frontend.bat""

echo Waiting for the frontend to become ready...
set /a attempts=0

:wait_frontend
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://localhost:3000 -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 goto :open_frontend

set /a attempts+=1
if %attempts% GEQ 60 goto :done

timeout /t 1 /nobreak >nul
goto :wait_frontend

:open_frontend
start "" http://localhost:3000

:done
