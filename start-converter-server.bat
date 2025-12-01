@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           שרת המרת PDF מקומי - הפעלה                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM בדיקה אם Python מותקן
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python לא מותקן!
    echo.
    echo התקן מ: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python נמצא
echo.

REM בדיקה אם pip מותקן
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ pip לא מותקן!
    pause
    exit /b 1
)

echo ✅ pip נמצא
echo.

echo [1/2] מתקין תלויות Python...
echo.

REM התקן את התלויות (pymongo אופציונלי)
pip install flask flask-cors PyMuPDF Pillow PyGithub python-dotenv

if %errorlevel% neq 0 (
    echo.
    echo ❌ התקנת התלויות נכשלה!
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ התלויות הותקנו בהצלחה
echo.

echo [2/2] מפעיל שרת...
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  השרת יפעל על: http://localhost:5000                      ║
echo ║  לעצירה: לחץ Ctrl+C                                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM הרץ את השרת
python scripts\server.py

pause
