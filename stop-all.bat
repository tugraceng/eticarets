@echo off
echo ==========================================
echo  Backend + Frontend durduruluyor...
echo ==========================================
taskkill /FI "WINDOWTITLE eq Backend - @platform/backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend - @platform/frontend*" /T /F >nul 2>&1
echo Portlari kullanan node surecleri (4000, 3000) de sonlandiriliyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /PID %%a /F >nul 2>&1
echo Tamamlandi.
timeout /t 2 /nobreak >nul
