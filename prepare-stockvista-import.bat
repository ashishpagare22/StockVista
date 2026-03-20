@echo off
setlocal

if "%~1"=="" goto :usage
if "%~2"=="" goto :usage

set "EXCHANGE=%~1"
set "INPUT_FILE=%~2"
set "ROOT=%~dp0"

cd /d "%ROOT%backend"

echo Preparing StockVista import for %EXCHANGE%...

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

python -m app.sync prepare-import --exchange "%EXCHANGE%" --input "%INPUT_FILE%"
if errorlevel 1 goto :fail

echo.
echo Import preparation finished.
pause
goto :eof

:usage
echo Usage:
echo   prepare-stockvista-import.bat NSE "C:\path\to\raw-file.csv"
echo   prepare-stockvista-import.bat BSE "C:\path\to\raw-file.tsv"
echo.
echo Output files will be created in backend\data\imports\
pause
exit /b 1

:fail
echo.
echo StockVista import preparation failed.
echo Check the error above, then try again.
pause
exit /b 1
