@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Cai Node.js 24 LTS roi mo lai file nay.
  pause
  exit /b 1
)
node scripts\start-local.mjs
if errorlevel 1 pause
