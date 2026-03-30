#!/bin/bash

echo ""
echo "=============================="
echo "  AQP ENGINE — STARTUP SCRIPT"
echo "=============================="
echo ""

# --- Backend ---
echo "📦 Setting up Python backend..."
cd backend

python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

echo ""
echo "📊 Generating dataset (1M rows)..."
python generate_data.py

echo ""
echo "🚀 Starting FastAPI backend on http://localhost:8000 ..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# --- Frontend ---
echo ""
echo "🎨 Setting up React frontend..."
cd frontend
npm install --silent

echo ""
echo "🌐 Starting React app on http://localhost:3000 ..."
npm start &
FRONTEND_PID=$!

echo ""
echo "=============================="
echo "  ✅ Both servers are running!"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "=============================="
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait and clean up
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
