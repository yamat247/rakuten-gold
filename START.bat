@echo off
chcp 65001 >nul 2>&1
title Rakuten GOLD Product Page Automation System - Main Menu
color 0F

:MAIN_MENU
cls
echo.
echo ========================================================================
echo           Rakuten GOLD Product Page Automation System v1.0
echo     Amazon ASIN to Rakuten Product Page Complete Automation Solution
echo.
echo  Work Time 83%% Reduction   Sales Growth   AI Optimization   Batch Processing
echo ========================================================================
echo.

cd /d "%~dp0"

REM System status check
set SETUP_STATUS=NO
set ENV_STATUS=NO
set VENV_STATUS=NO

if exist venv set VENV_STATUS=YES
if exist .env set ENV_STATUS=YES
if exist templates\rakuten_gold_template.html set SETUP_STATUS=YES

echo System Status:
echo   Virtual Environment: %VENV_STATUS%   Config File: %ENV_STATUS%   Setup: %SETUP_STATUS%
echo.

echo Main Menu:
echo.
echo   [Initial Setup]
echo   1. Run Initial Setup (Required for first time)
echo   2. Configuration Management (API Key setup, etc.)
echo.
echo   [System Execution]
echo   3. Start GUI Version (Recommended)
echo   4. Start CLI Version (Command Line)
echo.
echo   [Maintenance]
echo   5. System Test
echo   6. Help and Usage Guide
echo   7. Exit
echo.

set /p choice="Please enter a number (1-7): "

if "%choice%"=="1" goto SETUP
if "%choice%"=="2" goto CONFIG
if "%choice%"=="3" goto GUI_START
if "%choice%"=="4" goto CLI_START
if "%choice%"=="5" goto SYSTEM_TEST
if "%choice%"=="6" goto HELP
if "%choice%"=="7" goto END

echo Invalid selection
timeout 2 >nul
goto MAIN_MENU

:SETUP
echo.
echo Starting initial setup...
call setup.bat
pause
goto MAIN_MENU

:CONFIG
echo.
echo Opening configuration management...
call config.bat
goto MAIN_MENU

:GUI_START
echo.
if not exist venv (
    echo ERROR: Initial setup not completed
    echo Please select "1. Run Initial Setup" first
    pause
    goto MAIN_MENU
)
if not exist .env (
    echo ERROR: API keys not configured
    echo Please select "2. Configuration Management" to set API keys
    pause
    goto MAIN_MENU
)
echo Starting GUI version...
call rakuten_gold_start.bat
goto MAIN_MENU

:CLI_START
echo.
if not exist venv (
    echo ERROR: Initial setup not completed
    echo Please select "1. Run Initial Setup" first
    pause
    goto MAIN_MENU
)
if not exist .env (
    echo ERROR: API keys not configured
    echo Please select "2. Configuration Management" to set API keys
    pause
    goto MAIN_MENU
)
echo Starting CLI version...
call rakuten_cli.bat
goto MAIN_MENU

:SYSTEM_TEST
echo.
echo Running system test...
if exist venv (
    call venv\Scripts\activate.bat
    python main.py test
) else (
    echo ERROR: Initial setup required
)
pause
goto MAIN_MENU

:HELP
cls
echo.
echo ========================================================================
echo                           Usage Guide
echo ========================================================================
echo.
echo Quick Start:
echo.
echo   Step 1: Run Initial Setup
echo      - Create Python virtual environment
echo      - Install required libraries
echo      - Create directories and files
echo.
echo   Step 2: Configure API Keys
echo      - Amazon Product Data API (3rd party API)
echo      - Google Gemini AI API (Free)
echo      - Rakuten RMS API (For Rakuten store owners)
echo.
echo   Step 3: Run System
echo      - GUI Version: User-friendly interface
echo      - CLI Version: Command line operation
echo.
echo How to get API Keys:
echo.
echo   Amazon Product Data API:
echo      - Search on RapidAPI (https://rapidapi.com/)
echo      - Monthly cost: $50-200
echo.
echo   Google Gemini AI API:
echo      - Visit https://makersuite.google.com/
echo      - Free to obtain
echo.
echo   Rakuten RMS API:
echo      - Rakuten RMS - Store Settings - API
echo      - Get Service Secret and License Key
echo.
echo Expected Results:
echo   - Work time reduction: 2 hours to 20 minutes (83%% reduction)
echo   - Quality improvement: AI-generated SEO optimization
echo   - Sales growth: Improved search rankings
echo.
pause
goto MAIN_MENU

:END
echo.
echo System will exit.
echo Thank you for using our system!
echo.
echo Next time, double-click START.bat to launch
timeout 3 >nul
