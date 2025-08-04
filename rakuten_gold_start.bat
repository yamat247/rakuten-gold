@echo off
chcp 65001 >nul 2>&1
title Rakuten GOLD Automation System - GUI Version
color 0B

echo.
echo ========================================================================
echo           Rakuten GOLD Product Page Automation System v1.0
echo                      GUI Version Startup
echo ========================================================================
echo.

cd /d "%~dp0"

REM Check and activate virtual environment
if not exist venv (
    echo ERROR: Virtual environment not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Check environment variables file
if not exist .env (
    echo WARNING: .env file not found
    echo Copy .env.example to .env and set your API keys
    echo.
    echo Do you want to copy .env.example to .env? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        copy .env.example .env
        echo .env file created successfully
        echo Please edit .env file to set your API keys
        notepad .env
    )
)

echo.
echo Starting GUI system...
echo Please wait for the window to open...
echo.

python main.py gui

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start system
    echo Please check main.py or required files
    pause
)
