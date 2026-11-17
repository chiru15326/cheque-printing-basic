@echo off
REM ============================================================
REM  Builds React + .NET API and publishes to C:\Apps\ChequeApp
REM  Run as Administrator if the Windows Service is installed
REM  (it is stopped and started again automatically).
REM  Your database (ChequeDb.db) in C:\Apps\ChequeApp is NOT touched.
REM ============================================================
setlocal
set APP_DIR=C:\Apps\ChequeApp

echo.
echo === 1/3  Building React app into ChequeApi\wwwroot ===
pushd "%~dp0cheque-ui"
call npm install
if errorlevel 1 goto :error
call npm run build
if errorlevel 1 goto :error
popd

echo.
echo === 2/3  Stopping service (if installed) ===
sc query ChequeApp >nul 2>&1
if not errorlevel 1 (
  sc stop ChequeApp >nul 2>&1
  timeout /t 4 /nobreak >nul
)

echo.
echo === 3/3  Publishing .NET API to %APP_DIR% ===
REM self-contained = the host PC does NOT need .NET installed
pushd "%~dp0ChequeApi"
dotnet publish -c Release -r win-x64 --self-contained true -o "%APP_DIR%"
if errorlevel 1 goto :error
popd

sc query ChequeApp >nul 2>&1
if not errorlevel 1 sc start ChequeApp >nul 2>&1

echo.
echo Done. App published to %APP_DIR%
echo First time? Run install-service.bat as Administrator.
pause
exit /b 0

:error
popd
echo.
echo *** BUILD FAILED - see the messages above ***
pause
exit /b 1
