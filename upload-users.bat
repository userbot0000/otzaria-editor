@echo off
echo Uploading users.json to Vercel Blob Storage...
node --env-file=.env.local scripts/upload-users.js
pause
