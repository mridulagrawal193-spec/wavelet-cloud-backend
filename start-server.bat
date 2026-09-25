@echo off
title Wavelet Cloud Backend API
echo ========================================================
echo         Starting Wavelet Cloud Streaming Engine...
echo ========================================================
echo.
cd /d "%~dp0"
call npm run dev
pause
