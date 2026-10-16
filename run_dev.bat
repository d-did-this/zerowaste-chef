@echo off
title ZeroWaste Chef - Dev Server
cd /d "%~dp0"
echo ========================================================
echo        ZeroWaste Chef - Vision Pipeline Dev Server
echo ========================================================
echo Opening http://localhost:3000 in your browser...
start http://localhost:3000
npm run dev
pause
