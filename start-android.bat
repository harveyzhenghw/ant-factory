@echo off
setlocal EnableExtensions
title Ant Factory - Android (Expo Go)
cd /d "%~dp0"

set "EXPO=node_modules\.bin\expo.cmd"

if not exist "%EXPO%" (
    echo Dependencies not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

set "EXPO_NO_TELEMETRY=1"
set "EXPO_NO_WEB_SETUP=1"

curl -s -o nul "http://localhost:8081/_expo/open?platform=android"
if not errorlevel 1 (
    echo Dev server already running - opening on Android...
    curl -s -o nul -X POST "http://localhost:8081/_expo/open?platform=android"
    pause
    exit /b 0
)

set "RESTARTS=0"

:restart
if "%RESTARTS%" GTR 10 (
    echo Server failed to stay up 10 times. Giving up.
    pause
    exit /b 1
)
echo.
echo Starting Expo dev server for Android... Press Ctrl+C to stop.
call "%EXPO%" start --android %*
set "code=%errorlevel%"
if "%code%"=="0" goto :done
if "%code%"=="130" goto :done
set /a RESTARTS+=1
echo Server stopped unexpectedly (exit code %code%). Restarting in 3 seconds...
timeout /t 3 /nobreak >nul
goto :restart

:done
echo Server stopped.
pause
exit /b 0
