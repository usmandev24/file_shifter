@echo off
REM --------------------------copyright c 2025 Usman Ghani (usmandev24) ----------------------
REM -----------------------------------------------------------------------------------------
REM Note: Internet connection is required for the first-time installation and app execution.
REM ------------------------------------------------------------------------------------------

REM Store the original working directory
SET "OriginalDir=%CD%"

REM If relaunched with directory argument, restore it
IF NOT "%1"=="" (
    cd /d "%1"
    SET "OriginalDir=%1"
)

ECHO Working directory: %CD%

REM Check if Node.js and npm are available
where node >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    where npm >nul 2>&1
    IF %ERRORLEVEL% EQU 0 (
        ECHO Node.js and npm are already installed.
        GOTO AfterInstall
    ) ELSE (
        ECHO npm not found.
        GOTO InstallNode
    )
) ELSE (
    ECHO Node.js not found.
    GOTO InstallNode
)

:InstallNode
REM Test internet connection
ping google.com -n 1 >nul
IF %ERRORLEVEL% NEQ 0 (
    ECHO.
    ECHO -------------------------------------------
    ECHO Internet connection not detected.
    ECHO Please connect to the internet and try again.
    ECHO -------------------------------------------
    ECHO.
    timeout /t 5 >nul
    exit /b 1
)

REM Check for admin privileges
net session >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO Administrator privileges are required. Relaunching as Administrator...
    REM Pass the original directory as an argument
    powershell -Command "Start-Process cmd -ArgumentList '/c %~f0 \"%OriginalDir%\"' -Verb RunAs"
    exit /b
)

ECHO File Shifter requires Node.js to run.
ECHO Checking for winget...
where winget >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO -------------------------------------------------------------------------------------------
    ECHO winget not found. Please ensure winget is installed on your system.
    ECHO You can install winget via the Microsoft Store or Windows Package Manager.
    ECHO
    ECHO OR Manually download Node.js from nodejs website and install it. And Than run this install file.
    ECHO 
    ECHO ---------------------------------------------------------------------------------------------
    timeout /t 10 >nul
    exit /b 1
)

ECHO Installing Node.js LTS version using winget...
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
IF %ERRORLEVEL% NEQ 0 (
    ECHO Node.js LTS installation failed.
    timeout /t 5 >nul
    exit /b 1
)
ECHO Node.js LTS installation completed successfully.

REM Refresh environment variables
SET "PATH=%PATH%;%ProgramFiles%\nodejs\"

:AfterInstall
REM Ensure working directory is restored
cd /d "%OriginalDir%"
timeout /t 2 >nul

REM Create app.bat using sequential redirection for reliability
ECHO Creating App.bat...
echo @echo off > App.bat
echo REM --------------------------copyright 2025 Usman Ghani ^(usmandev24^) ------------------------ >> App.bat
echo REM --------------Note: Run from Command Prompt --------------------------------------------- >> App.bat
echo. >> app.bat
echo ECHO To stop the app, press Ctrl ^+ C. >> App.bat
echo call npm start >> App.bat
echo ECHO Exiting... >> App.bat
echo timeout /t 5 ^>nul >> App.bat
echo exit /b 0 >> App.bat

REM Verify app.bat creation
IF EXIST App.bat (
    ECHO App.bat created successfully.
    
) ELSE (
    ECHO Failed to create App.bat. Check permissions or disk space in %CD%.
    pause
    exit /b 1
)

ECHO Running npm install...
call npm install --omit=dev
IF %ERRORLEVEL% NEQ 0 (
    ECHO Error occurred during npm install. Check your connection and try again.
    ECHO Exiting in 3 seconds...
    timeout /t 3 >nul
    exit /b 1
)
ECHO Installation completed successfully.
ECHO.

ECHO ---------------- Run "App" to start File Shifter ------------
ECHO.
ECHO Setup finished. Exiting in 10 seconds...
timeout /t 10 >nul
exit /b 0