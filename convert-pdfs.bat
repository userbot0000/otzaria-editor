@echo off
chcp 65001 >nul

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           המרת PDFs לתמונות - אוטומטי                     ║
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

echo [1/3] מתקין תלויות Python...
echo.

REM התקן את התלויות
pip install -r scripts\requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ❌ התקנת התלויות נכשלה!
    echo.
    echo נסה להתקין ידנית:
    echo   pip install pdf2image Pillow
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ התלויות הותקנו בהצלחה
echo.

echo [2/3] בודק אם יש PDFs להמרה...
echo.

if not exist "public\assets\library\*.pdf" (
    echo ⚠️  לא נמצאו קבצי PDF בתיקייה public\assets\library
    echo.
    echo שים קבצי PDF בתיקייה:
    echo   public\assets\library\
    echo.
    pause
    exit /b 1
)

echo ✅ נמצאו קבצי PDF
echo.

echo [3/3] מתחיל המרה...
echo.
echo זה עשוי לקחת כמה דקות תלוי במספר הספרים...
echo.

REM הרץ את סקריפט ההמרה על כל הקבצים
python scripts\convert_pdf_to_images.py --all

if %errorlevel% equ 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║                  ✅ ההמרה הושלמה!                         ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo התמונות נשמרו ב: public\thumbnails\
    echo.
    echo עכשיו תוכל להעלות לענן:
    echo   git add public\thumbnails
    echo   git commit -m "Add book thumbnails"
    echo   git push
    echo.
) else (
    echo.
    echo ❌ ההמרה נכשלה!
    echo.
    echo בדוק את השגיאות למעלה.
    echo.
    echo אם חסר Poppler, הורד מ:
    echo   https://github.com/oschwartz10612/poppler-windows/releases/
    echo.
    echo חלץ והוסף את התיקייה bin\ ל-PATH
    echo.
)

pause
