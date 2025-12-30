@echo off
echo ====================================
echo Starting Two Rooms and a Boom Server
echo ====================================
echo.

cd server
echo Installing dependencies...
call npm install
echo.

echo Starting server...
call npm run dev
