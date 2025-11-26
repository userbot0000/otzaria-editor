@echo off
echo ========================================
echo    הורדת כל הנתונים מ-Vercel Blob
echo ========================================
echo.

node scripts/download-from-blob.js

echo.
echo לחץ על מקש כלשהו לסגירה...
pause > nul
