@echo off
REM Removes the Windows Service and firewall rule. Files and database stay in C:\Apps\ChequeApp.
net session >nul 2>&1
if errorlevel 1 (
  echo Please right-click this file and choose "Run as administrator".
  pause
  exit /b 1
)
sc stop ChequeApp >nul 2>&1
timeout /t 3 /nobreak >nul
sc delete ChequeApp
netsh advfirewall firewall delete rule name="ChequeApp 5000"
echo Service removed. Your files and ChequeDb.db are still in C:\Apps\ChequeApp.
pause
