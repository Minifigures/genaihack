@echo off
echo Starting VIGIL Backend...
start "VIGIL Backend" cmd /c "start_backend.bat"

echo Starting VIGIL Frontend...
start "VIGIL Frontend" cmd /c "start_frontend.bat"

echo Both servers are starting!
echo Frontend will be available at http://localhost:3000
echo Backend API will be available at http://localhost:8000
pause
