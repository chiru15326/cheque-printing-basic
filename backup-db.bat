@echo off
REM Copies the database to C:\Apps\ChequeBackups with date and time in the name.
REM Run as Administrator (the service is stopped for a few seconds for a clean copy).
setlocal
set APP_DIR=C:\Apps\ChequeApp
set BACKUP_DIR=C:\Apps\ChequeBackups

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set TS=%%i
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

sc stop ChequeApp >nul 2>&1
timeout /t 4 /nobreak >nul

copy /y "%APP_DIR%\ChequeDb.db" "%BACKUP_DIR%\ChequeDb_%TS%.db"
if exist "%APP_DIR%\ChequeDb.db-wal" copy /y "%APP_DIR%\ChequeDb.db-wal" "%BACKUP_DIR%\ChequeDb_%TS%.db-wal"

sc start ChequeApp >nul 2>&1
echo Backup saved to %BACKUP_DIR%\ChequeDb_%TS%.db
pause
