@echo off
cd /d "C:\dart-v9"

set PY=C:\Users\khcho\AppData\Local\Python\pythoncore-3.14-64\python.exe
set NPM="C:\Program Files\nodejs\npm.cmd"

echo.
echo ====================================
echo  DART v9 Starting...
echo ====================================
echo.

echo [1/2] FastAPI API server (port 8002)...
start "DART-v9-API" cmd /k "%PY% -m uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload"

timeout /t 4 /nobreak >nul

echo [2/2] Vite UI server (port 5174)...
start "DART-v9-UI" cmd /k "%NPM% run dev"

timeout /t 12 /nobreak >nul

echo Opening browser...
start http://localhost:5174

echo.
echo Done!
echo  API : http://localhost:8002/docs
echo  UI  : http://localhost:5174
echo.
pause
