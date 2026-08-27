@echo off
title Bari Vara & Electricity Billing App
cd /d "%~dp0"
echo Starting Bari Vara App...
start http://localhost:3000
node server.js
pause
