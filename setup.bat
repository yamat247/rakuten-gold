@echo off
chcp 65001 >nul 2>&1
title Rakuten GOLD Automation System - Initial Setup
color 0A

echo.
echo ========================================================================
echo           Rakuten GOLD Product Page Automation System v1.0
echo                         Initial Setup
echo ========================================================================
echo.

cd /d "%~dp0"

echo Starting initial setup...
echo.

REM Create Python virtual environment
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        echo Please check if Python is installed correctly
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing required libraries...
pip install --upgrade pip
pip install aiohttp requests google-generativeai python-dotenv asyncio

echo.
echo Creating necessary directories...
python main.py setup

echo.
echo Creating sample files...
python main.py samples

echo.
echo Running system test...
python main.py test

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo   1. Edit .env file to set API keys
echo   2. Run rakuten_gold_start.bat to start the system
echo.

pause
