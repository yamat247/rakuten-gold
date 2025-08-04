@echo off
chcp 65001 >nul 2>&1
title Rakuten GOLD Automation System - CLI Version
color 0E

echo.
echo ========================================================================
echo           Rakuten GOLD Product Page Automation System v1.0
echo                       Command Line Version
echo ========================================================================
echo.

cd /d "%~dp0"

REM Activate virtual environment
if not exist venv (
    echo ERROR: Virtual environment not found
    echo Please run setup.bat first
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

:MENU
echo.
echo Please select processing method:
echo.
echo   1. Single ASIN processing
echo   2. Multiple ASIN processing (comma-separated)
echo   3. CSV file batch processing
echo   4. Run system test
echo   5. Exit
echo.
set /p choice="Enter number (1-5): "

if "%choice%"=="1" goto SINGLE_ASIN
if "%choice%"=="2" goto MULTIPLE_ASIN
if "%choice%"=="3" goto CSV_PROCESS
if "%choice%"=="4" goto SYSTEM_TEST
if "%choice%"=="5" goto END
goto MENU

:SINGLE_ASIN
echo.
set /p asin="Enter ASIN (e.g., B07XJ8C8F5): "
if "%asin%"=="" (
    echo ERROR: ASIN not entered
    goto MENU
)
echo.
echo Processing ASIN %asin%...
python main.py cli --asin %asin%
echo.
echo Processing completed. Check output folder for results.
pause
goto MENU

:MULTIPLE_ASIN
echo.
echo Enter multiple ASINs separated by commas
set /p asins="ASIN list (e.g., B07XJ8C8F5,B085KNRR34): "
if "%asins%"=="" (
    echo ERROR: ASINs not entered
    goto MENU
)
echo.
echo Processing multiple ASINs...
python main.py cli --asin-list "%asins%"
echo.
echo Processing completed. Check output folder for results.
pause
goto MENU

:CSV_PROCESS
echo.
echo Available CSV files:
if exist input\*.csv (
    dir /b input\*.csv
) else (
    echo   No CSV files found
    echo   Please place ASIN list CSV files in the input folder
    pause
    goto MENU
)
echo.
set /p csvfile="Enter CSV filename: "
if "%csvfile%"=="" (
    echo ERROR: Filename not entered
    goto MENU
)
if not exist "input\%csvfile%" (
    echo ERROR: File not found: input\%csvfile%
    pause
    goto MENU
)
echo.
echo Processing CSV file input\%csvfile%...
python main.py cli --csv "input\%csvfile%"
echo.
echo Processing completed. Check output folder for results.
pause
goto MENU

:SYSTEM_TEST
echo.
echo Running system test...
python main.py test
echo.
pause
goto MENU

:END
echo.
echo Exiting system.
echo Thank you!
pause
