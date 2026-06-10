@echo off
cd /d "%~dp0backend"
echo Starting Rockfall Prediction API on http://localhost:8000 ...
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
