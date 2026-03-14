@echo off
cd /d C:\Users\roofa\genaihack
C:\Users\roofa\AppData\Local\Programs\Python\Python314\python.exe -m uvicorn backend.main:app --reload --port 8000 --host 0.0.0.0
pause
