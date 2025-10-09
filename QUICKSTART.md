# Quick Start Guide

Get the Stock Prediction App running in 5 minutes!

## Prerequisites

- ✅ Python 3.8+ installed
- ✅ Node.js 14+ installed
- ✅ Internet connection (for stock data)

---

## Step 1: Setup Backend (2 minutes)

### Windows:

```bash
# Navigate to project
cd stocky/backend

# Create virtual environment
python -m venv ../venv

# Activate virtual environment
..\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the model
python train_model.py
```

### macOS/Linux:

```bash
# Navigate to project
cd stocky/backend

# Create virtual environment
python3 -m venv ../venv

# Activate virtual environment
source ../venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the model
python train_model.py
```

**Expected:** Model training will take 30-60 seconds and show 51.88% accuracy.

---

## Step 2: Setup Frontend (1 minute)

```bash
# Navigate to frontend (new terminal)
cd stocky/frontend

# Install dependencies
npm install
```

---

## Step 3: Run the Application (2 terminals)

### Terminal 1 - Backend:

```bash
cd stocky/backend
python app.py
```

**Expected output:**
```
============================================================
Stock Prediction API Server
============================================================
...
Server starting on http://localhost:5000
============================================================
```

### Terminal 2 - Frontend:

```bash
cd stocky/frontend
npm start
```

**Expected:** Browser opens automatically at http://localhost:3000

---

## Step 4: Use the App!

1. **Default view**: SPY prediction loads automatically
2. **Try different stocks**: Enter "AAPL", "TSLA", "QQQ", etc.
3. **Click "Predict"** to get ML-based prediction
4. **View results**:
   - 🟢 UP or 🔴 DOWN prediction
   - Confidence percentage
   - Current price
   - 3-month chart

---

## Troubleshooting

### Backend won't start

**Problem:** "Model not found"
**Solution:** Run `python train_model.py` first

**Problem:** "Port 5000 already in use"
**Solution:** Kill the process or change port in `app.py`

### Frontend won't start

**Problem:** "npm install" fails
**Solution:** Delete `node_modules` and `package-lock.json`, then retry

**Problem:** "Network Error" in browser
**Solution:** Make sure backend is running on http://localhost:5000

### Predictions fail

**Problem:** "Failed to get prediction"
**Solution:** Check internet connection (yfinance needs it)

---

## Architecture

```
┌─────────────────────────────────────────┐
│          React Frontend                 │
│       http://localhost:3000            │
│                                        │
│  • Search stocks                       │
│  • Display predictions                 │
│  • Show charts                         │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               ↓
┌──────────────────────────────────────────┐
│          Flask API Backend              │
│       http://localhost:5000             │
│                                         │
│  • Serve predictions                    │
│  • Fetch stock data                     │
│  • Process ML model                     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────┐
│     Random Forest ML Model              │
│     (51.88% accuracy)                   │
│                                         │
│  • 30 technical indicators              │
│  • 300 estimators                       │
│  • Trained on 10+ years SPY data        │
└─────────────────────────────────────────┘
```

---

## Next Steps

- ✅ Test different stock symbols
- ✅ Check prediction confidence levels
- ✅ Analyze the price charts
- ✅ Read API documentation in `backend/API_GUIDE.md`
- ✅ Explore code in `frontend/src/App.js`

---

## Project Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: ML Model | ✅ Complete | 100% |
| Phase 2: Flask API | ✅ Complete | 100% |
| Phase 3: React Frontend | ✅ Complete | 100% |
| Phase 4: Multi-Asset Support | 🔜 Future | 0% |

---

## Support

- **API Documentation**: `backend/API_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Frontend README**: `frontend/README.md`
- **Main README**: `README.md`

---

**Enjoy your Stock Prediction App! 🚀**

*Remember: This is for educational purposes only. Not financial advice!*
