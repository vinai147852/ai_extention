@echo off
title MCP Server Manager

:menu
cls
echo ================================
echo    MCP Server Manager
echo ================================
echo 1. Start Server
echo 2. Stop Server (kill port 3000)
echo 3. Restart Server
echo 4. Check Server Status
echo 5. Install Dependencies
echo 6. Exit
echo ================================
set /p choice="Choose an option (1-6): "

if "%choice%"=="1" goto start
if "%choice%"=="2" goto stop
if "%choice%"=="3" goto restart
if "%choice%"=="4" goto status
if "%choice%"=="5" goto install
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
pause
goto menu

:start
echo Starting MCP Server...
npm start
pause
goto menu

:stop
echo Stopping any process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F 2>nul
echo Port 3000 cleared.
pause
goto menu

:restart
echo Restarting MCP Server...
call :stop
timeout /t 2 /nobreak >nul
call :start
goto menu

:status
echo Checking server status...
curl -X GET http://localhost:3000/health 2>nul || echo Server is not running on port 3000
netstat -ano | findstr :3000
pause
goto menu

:install
echo Installing dependencies...
npm install
echo Dependencies installed.
pause
goto menu

:exit
echo Goodbye!
exit