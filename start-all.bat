@echo off
cd /d "%~dp0"
echo ==========================================
echo  Backend + Frontend ayri pencerelerde aciliyor...
echo  Backend  : http://localhost:4000/api
echo  Frontend : http://localhost:3000
echo  Admin    : http://localhost:3000/admin/login
echo ==========================================
start "Backend - @platform/backend" cmd /k "cd /d %~dp0 && npm run dev:backend"
timeout /t 3 /nobreak >nul
start "Frontend - @platform/frontend" cmd /k "cd /d %~dp0 && npm run dev:frontend"
timeout /t 2 /nobreak >nul
echo.
echo Her iki pencere acildi. Bu pencereyi kapatabilirsiniz.
timeout /t 5 /nobreak >nul
exit
