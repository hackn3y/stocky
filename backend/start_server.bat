@echo off
echo ============================================================
echo Starting Stock Prediction API Server
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "..\venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv ..\venv
    pause
    exit /b 1
)

if not exist "models\spy_model.pkl" (
    echo WARNING: Model file not found!
    echo Please train the model first: python train_model.py
    echo.
    pause
)

echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

..\venv\Scripts\python.exe app.py

pause
