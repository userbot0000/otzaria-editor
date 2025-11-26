@echo off
echo Making admin@gmail.com an admin...
curl -X POST http://localhost:3000/api/admin/make-admin -H "Content-Type: application/json" -d "{\"email\":\"admin@gmail.com\",\"secretKey\":\"CHANGE_ME_SECRET_123\"}"
echo.
pause
