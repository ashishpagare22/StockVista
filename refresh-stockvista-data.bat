@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%backend"

echo Refreshing StockVista local database...

if not exist ".venv\Scripts\activate.bat" (
  echo Creating Python virtual environment...
  python -m venv .venv
  if errorlevel 1 goto :fail
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 goto :fail

echo Installing or updating backend dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 goto :fail

python -m app.sync bootstrap
if errorlevel 1 goto :fail

echo.
echo StockVista local catalog refresh is complete.
pause
goto :eof

:fail
echo.
echo StockVista data refresh failed.
echo Check the error above, then try again.
pause
exit /b 1
