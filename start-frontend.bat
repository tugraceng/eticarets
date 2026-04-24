@echo off
title Frontend - @platform/frontend
cd /d "%~dp0"
echo ==========================================
echo  Frontend baslatiliyor (http://localhost:3000)
echo ==========================================
call npm run dev:frontend
pause
