@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%frontend"

echo Starting StockVista frontend...

if not exist "node_modules" (
  echo Installing frontend dependencies...
  npm install
  if errorlevel 1 goto :fail
)

if exist ".next" (
  echo Resetting Next.js dev cache...
  rmdir /s /q ".next"
  if errorlevel 1 goto :fail
)

npm run dev
goto :eof

:fail
echo.
echo StockVista frontend failed to start.
echo Check the error above, then try again.
pause
exit /b 1
