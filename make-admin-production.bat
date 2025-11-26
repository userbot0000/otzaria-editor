@echo off
echo Enter your production URL (e.g., https://yoursite.vercel.app):
set /p SITE_URL=
echo.
echo Enter the email to make admin:
set /p EMAIL=
echo.
echo Making %EMAIL% an admin on %SITE_URL%...
curl -X POST %SITE_URL%/api/admin/make-admin -H "Content-Type: application/json" -d "{\"email\":\"%EMAIL%\",\"secretKey\":\"CHANGE_ME_SECRET_123\"}"
echo.
pause
