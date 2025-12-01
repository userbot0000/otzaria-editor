@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           בדיקת שרת המרת PDF                               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/2] בודק אם השרת רץ...
echo.

curl -s http://localhost:5000/health >nul 2>&1

if %errorlevel% equ 0 (
    echo ✅ השרת רץ!
    echo.
    echo פרטי השרת:
    curl -s http://localhost:5000/health
    echo.
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║  השרת פעיל ומוכן לשימוש                                  ║
    echo ╚════════════════════════════════════════════════════════════╝
) else (
    echo ❌ השרת לא רץ!
    echo.
    echo להפעלת השרת, הרץ:
    echo   start-converter-server.bat
    echo.
)

echo.
pause
