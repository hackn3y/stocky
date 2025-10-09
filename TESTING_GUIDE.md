# API Testing Guide

This guide will help you test the Flask API thoroughly.

## Prerequisites

✅ Virtual environment activated
✅ All dependencies installed (`pip install -r requirements.txt`)
✅ Model trained (`python train_model.py`)

---

## Method 1: Automated Testing (Recommended)

### Step 1: Start the Server

**Option A - Using batch file (Windows):**
```bash
cd backend
start_server.bat
```

**Option B - Manual start:**
```bash
cd backend
python app.py
```

You should see:
```
============================================================
Stock Prediction API Server
============================================================

Available endpoints:
  GET  /api/health              - Health check
  GET  /api/model/info          - Model information
  ...

Server starting on http://localhost:5000
============================================================
```

### Step 2: Run the Test Suite

Open a **NEW terminal window** (keep the server running in the first one):

```bash
cd backend
python run_tests.py
```

The test script will:
- Test all 11 endpoints
- Verify error handling
- Show detailed results
- Give you a summary

**Expected Output:**
```
============================================================
  Test Summary
============================================================

  Total Tests: 11
  ✓ Passed: 11
  ✗ Failed: 0
  Success Rate: 100.0%

  🎉 All tests passed! API is working correctly.
  ✅ Ready for Phase 3: React Frontend
```

---

## Method 2: Manual Testing

### Using curl (Command Line)

#### Test 1: Health Check
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "version": "1.0.0"
}
```

#### Test 2: Get Prediction
```bash
curl http://localhost:5000/api/predict/SPY
```

Expected response:
```json
{
  "success": true,
  "symbol": "SPY",
  "prediction": "UP",
  "confidence": 63.83,
  "current_price": 673.11,
  "probabilities": {
    "up": 63.83,
    "down": 36.17
  }
}
```

#### Test 3: Historical Data
```bash
curl "http://localhost:5000/api/historical/SPY?period=1mo&interval=1d"
```

#### Test 4: Batch Predictions
```bash
curl -X POST http://localhost:5000/api/predict/batch ^
  -H "Content-Type: application/json" ^
  -d "{\"symbols\": [\"SPY\", \"QQQ\", \"VOO\"]}"
```

### Using Browser

Simply open these URLs in your browser:

1. Health: http://localhost:5000/api/health
2. Model Info: http://localhost:5000/api/model/info
3. Prediction: http://localhost:5000/api/predict/SPY
4. Assets: http://localhost:5000/api/assets

---

## Method 3: Using Python Requests

Create a file `test_manual.py`:

```python
import requests

API_URL = "http://localhost:5000/api"

# Test prediction
response = requests.get(f"{API_URL}/predict/SPY")
data = response.json()

print(f"Symbol: {data['symbol']}")
print(f"Prediction: {data['prediction']}")
print(f"Confidence: {data['confidence']}%")
print(f"Current Price: ${data['current_price']}")
```

Run it:
```bash
python test_manual.py
```

---

## Common Issues & Solutions

### Issue 1: "Connection refused" or "Could not connect"

**Solution:** Make sure the Flask server is running
```bash
cd backend
python app.py
```

### Issue 2: "Model not found" error

**Solution:** Train the model first
```bash
cd backend
python train_model.py
```

### Issue 3: "yfinance" errors

**Solution:** Check internet connection and try again. Yahoo Finance sometimes has rate limits.

### Issue 4: Port 5000 already in use

**Solution:** Change the port in `app.py`:
```python
app.run(debug=True, port=5001, host='0.0.0.0')  # Changed to 5001
```

---

## What to Test

### ✅ Functional Tests

- [ ] Health check returns 200
- [ ] Model info shows correct details
- [ ] Predictions return UP or DOWN
- [ ] Predictions have confidence values
- [ ] Historical data returns OHLCV data
- [ ] Stock info returns company details
- [ ] Batch predictions work for multiple symbols
- [ ] Assets list shows supported symbols

### ✅ Error Handling Tests

- [ ] Invalid symbol returns 400 error
- [ ] Invalid endpoint returns 404 error
- [ ] Missing model returns 404 error
- [ ] Invalid JSON in POST returns 400

### ✅ Data Validation Tests

- [ ] Confidence is between 0-100
- [ ] Prices are positive numbers
- [ ] Dates are valid ISO format
- [ ] Volume data is integers
- [ ] Symbols are uppercase

---

## Test Results Checklist

After testing, verify:

- [ ] ✅ All endpoints respond correctly
- [ ] ✅ Error messages are clear and helpful
- [ ] ✅ Response times are reasonable (< 5 seconds)
- [ ] ✅ No server crashes or exceptions
- [ ] ✅ CORS headers are present (for frontend)
- [ ] ✅ JSON responses are well-formatted

---

## Next Steps

Once all tests pass:

1. ✅ Document any issues found
2. ✅ Fix any bugs
3. ✅ Commit changes to git
4. ✅ Move to Phase 3: React Frontend

---

## Quick Reference

**Start Server:**
```bash
cd backend
python app.py
```

**Run Tests:**
```bash
cd backend
python run_tests.py
```

**Stop Server:**
Press `Ctrl+C` in the server terminal

**View Logs:**
Check the terminal where server is running

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/model/info` | GET | Model information |
| `/api/predict/<symbol>` | GET | Get prediction |
| `/api/historical/<symbol>` | GET | Historical data |
| `/api/info/<symbol>` | GET | Stock info |
| `/api/predict/batch` | POST | Batch predictions |
| `/api/assets` | GET | Supported assets |

---

**Ready to test? Start the server and run the tests!** 🚀
