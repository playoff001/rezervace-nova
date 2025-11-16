@echo off
echo Spoustim rezervacni system...
echo.
echo Spoustim backend server...
start "Backend Server" cmd /k "npm run server"
timeout /t 3 /nobreak >nul
echo.
echo Spoustim frontend...
start "Frontend" cmd /k "npm run dev"
echo.
echo Aplikace se spousti...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
pause





