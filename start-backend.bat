@echo off
title Backend - @platform/backend
cd /d "%~dp0"
echo ==========================================
echo  Backend baslatiliyor (http://localhost:4000/api)
echo ==========================================
call npm run dev:backend
pause
