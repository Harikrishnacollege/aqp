@echo off
echo.
echo ==============================
echo   AQP ENGINE — STARTUP
echo ==============================
echo.

:: Backend
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo Generating dataset...
python generate_data.py

echo Starting FastAPI backend...
start "AQP Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --port 8000"

cd ..\frontend

echo Installing frontend dependencies...
npm install --silent

echo Starting React app...
start "AQP Frontend" cmd /k "npm start"

echo.
echo ==============================
echo   Both servers starting!
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ==============================
pause
