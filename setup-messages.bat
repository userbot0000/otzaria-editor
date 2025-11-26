@echo off
chcp 65001 > nul
echo ========================================
echo הקמת מערכת הודעות
echo ========================================
echo.

node scripts/setup-messages-collection.js

echo.
echo ========================================
pause
