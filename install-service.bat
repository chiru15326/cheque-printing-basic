@echo off
REM ============================================================
REM  Installs the app as a Windows Service (starts with the PC)
REM  and opens port 5000 for devices on your Wi-Fi.
REM  Right-click -> Run as administrator
REM ============================================================
net session >nul 2>&1
if errorlevel 1 (
  echo Please right-click this file and choose "Run as administrator".
  pause
  exit /b 1
)

set APP_DIR=C:\Apps\ChequeApp
if not exist "%APP_DIR%\ChequeApi.exe" (
  echo %APP_DIR%\ChequeApi.exe not found. Run publish.bat first.
  pause
  exit /b 1
)

echo Creating service...
sc create ChequeApp binPath= "\"%APP_DIR%\ChequeApi.exe\"" start= auto DisplayName= "Cheque Printing App"
sc description ChequeApp "Cheque printing web app on port 5000"
REM Restart automatically if it ever crashes
sc failure ChequeApp reset= 86400 actions= restart/5000/restart/5000/restart/5000

echo Opening firewall port 5000 (Private networks)...
netsh advfirewall firewall delete rule name="ChequeApp 5000" >nul 2>&1
netsh advfirewall firewall add rule name="ChequeApp 5000" dir=in action=allow protocol=TCP localport=5000 profile=private

echo Starting service...
sc start ChequeApp

echo.
echo ============================================================
echo  This PC's IP address:
ipconfig | findstr /i "IPv4"
echo.
echo  On phones / laptops on the same Wi-Fi open:
echo     http://THE-IP-ABOVE:5000
echo  On this PC you can also use http://localhost:5000
echo.
echo  Make sure your Wi-Fi is set to "Private" in Windows
echo  (Settings - Network - Wi-Fi - Network profile type).
echo ============================================================
pause
