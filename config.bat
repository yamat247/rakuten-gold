@echo off
chcp 65001 >nul 2>&1
title Rakuten GOLD Automation System - Configuration Management
color 0D

echo.
echo ========================================================================
echo           Rakuten GOLD Product Page Automation System v1.0
echo                    Configuration Management
echo ========================================================================
echo.

cd /d "%~dp0"

:MENU
echo.
echo Configuration Management Menu:
echo.
echo   1. Edit .env file (API Key setup)
echo   2. Run system test
echo   3. View log files
echo   4. Open output folder
echo   5. Reset database
echo   6. Full reset (WARNING: All settings and data will be deleted)
echo   7. Back
echo.
set /p choice="Enter number (1-7): "

if "%choice%"=="1" goto EDIT_ENV
if "%choice%"=="2" goto SYSTEM_TEST
if "%choice%"=="3" goto VIEW_LOGS
if "%choice%"=="4" goto OPEN_OUTPUT
if "%choice%"=="5" goto RESET_DB
if "%choice%"=="6" goto FULL_RESET
if "%choice%"=="7" goto END
goto MENU

:EDIT_ENV
echo.
if not exist .env (
    echo .env file does not exist. Create it? (Y/N)
    set /p create=
    if /i "%create%"=="Y" (
        copy .env.example .env
        echo .env file created successfully
    ) else (
        goto MENU
    )
)
echo Opening .env file...
notepad .env
echo.
echo API Key Setup Guide:
echo   - PRODUCT_DATA_API_KEY: Get Amazon Product API key from RapidAPI etc.
echo   - GEMINI_API_KEY: Get from https://makersuite.google.com/
echo   - RAKUTEN_SERVICE_SECRET: Get from Rakuten RMS
echo   - RAKUTEN_LICENSE_KEY: Get from Rakuten RMS
pause
goto MENU

:SYSTEM_TEST
echo.
echo Running system test...
if exist venv (
    call venv\Scripts\activate.bat
    python main.py test
) else (
    echo ERROR: Virtual environment not found
    echo Please run setup.bat first
)
pause
goto MENU

:VIEW_LOGS
echo.
echo Checking log files...
if exist rakuten_automation.log (
    echo Latest log content (last 20 lines):
    powershell "Get-Content rakuten_automation.log -Tail 20"
    echo.
    echo Open complete log file? (Y/N)
    set /p open=
    if /i "%open%"=="Y" notepad rakuten_automation.log
) else (
    echo ERROR: Log file not found
)
pause
goto MENU

:OPEN_OUTPUT
echo.
echo Opening output folder...
if exist output (
    explorer output
) else (
    echo ERROR: Output folder not found
    echo Please check system setup
)
pause
goto MENU

:RESET_DB
echo.
echo WARNING: Reset database
echo All processing history will be deleted. Continue? (Y/N)
set /p confirm=
if /i "%confirm%"=="Y" (
    if exist rakuten_automation.db (
        del rakuten_automation.db
        echo Database reset successfully
    ) else (
        echo ERROR: Database file not found
    )
) else (
    echo Cancelled
)
pause
goto MENU

:FULL_RESET
echo.
echo WARNING WARNING WARNING - Full Reset - WARNING WARNING WARNING
echo.
echo The following will be deleted:
echo   - .env file (API key settings)
echo   - Database file
echo   - Output folder
echo   - Log files
echo   - Virtual environment
echo.
echo Really execute? (Type YES to confirm)
set /p confirm=
if "%confirm%"=="YES" (
    echo Executing full reset...
    
    if exist .env del .env
    if exist rakuten_automation.db del rakuten_automation.db
    if exist rakuten_automation.log del rakuten_automation.log
    if exist output rmdir /s /q output
    if exist venv rmdir /s /q venv
    if exist __pycache__ rmdir /s /q __pycache__
    
    echo Full reset completed
    echo Please run setup.bat to re-setup
) else (
    echo Cancelled
)
pause
goto MENU

:END
