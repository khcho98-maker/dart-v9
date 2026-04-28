@echo off
cd /d "C:\dart-v9"
C:\Users\khcho\AppData\Local\Python\pythoncore-3.14-64\python.exe -m uvicorn api.main:app --host 0.0.0.0 --port 8002 --reload
pause
