@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%backend"

echo Starting StockVista backend...

if not exist ".venv\Scripts\activate.bat" (
  echo Creating Python virtual environment...
  python -m venv .venv
  if errorlevel 1 goto :fail
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 goto :fail

if not exist ".venv\stockvista-backend-ready" (
  echo Installing backend dependencies...
  python -m pip install -r requirements.txt
  if errorlevel 1 goto :fail
  type nul > ".venv\stockvista-backend-ready"
)

python -m uvicorn app.main:app --reload
goto :eof

:fail
echo.
echo StockVista backend failed to start.
echo Check the error above, then try again.
pause
exit /b 1
