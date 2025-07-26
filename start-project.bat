@echo off
echo Starting Bet on Number Project...
echo ================================

:: Start Backend Server
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

:: Start Frontend Server  
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ================================
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo ================================

:: Wait and open browser
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo Press any key to exit this window...
pause > nul