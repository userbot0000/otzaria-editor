@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           בדיקת מערכת המרת PDF                             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/5] בודק Python...
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Python מותקן
    python --version
) else (
    echo ❌ Python לא מותקן
    echo    הורד מ: https://www.python.org/downloads/
)
echo.

echo [2/5] בודק pip...
where pip >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ pip מותקן
) else (
    echo ❌ pip לא מותקן
)
echo.

echo [3/5] בודק תלויות Python...
pip show flask >nul 2>nul
if %errorlevel% equ 0 (
    echo ✅ Flask מותקן
) else (
    echo ⚠️  Flask לא מותקן
    echo    הרץ: start-converter-server.bat
)
echo.

echo [4/5] בודק קבצים...
if exist "scripts\server.py" (
    echo ✅ server.py קיים
) else (
    echo ❌ server.py חסר
)

if exist "start-converter-server.bat" (
    echo ✅ start-converter-server.bat קיים
) else (
    echo ❌ start-converter-server.bat חסר
)

if exist ".env.local" (
    echo ✅ .env.local קיים
) else (
    echo ⚠️  .env.local חסר
    echo    צור קובץ עם משתני הסביבה
)
echo.

echo [5/5] בודק שרת...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ השרת רץ
    curl -s http://localhost:5000/health
) else (
    echo ⚠️  השרת לא רץ
    echo    הפעל: start-converter-server.bat
)
echo.

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    סיכום                                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo אם הכל ירוק (✅), המערכת מוכנה לשימוש!
echo.
echo צעדים הבאים:
echo   1. הפעל: start-converter-server.bat
echo   2. פתח: http://localhost:3000/admin
echo   3. לחץ: טאב "ספרים" ^> "הוסף ספר"
echo.

pause
