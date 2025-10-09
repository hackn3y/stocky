# How to Test the Stock Prediction API

## Quick Start (2 Steps)

### Step 1: Start the Server

Open a terminal and run:

```bash
cd backend
python app.py
```

**You should see:**
```
============================================================
Stock Prediction API Server
============================================================

Available endpoints:
  GET  /api/health              - Health check
  ...

Server starting on http://localhost:5000
============================================================

 * Running on http://127.0.0.1:5000
```

✅ **Server is ready when you see "Running on..."**

---

### Step 2: Test the API

Open a **SECOND terminal** (keep the first one running) and run:

```bash
cd backend
python quick_test.py
```

**Expected output:**
```
==================================================
Flask API Quick Test
==================================================

Testing connection to Flask server...
URL: http://localhost:5000/api/health

✓ SUCCESS! Server is running!
  Status: healthy
  Version: 1.0.0

Testing prediction endpoint...

✓ Prediction works!
  Symbol: SPY
  Prediction: UP
  Confidence: 63.83%
  Price: $673.11

==================================================
✅ API is working correctly!
==================================================
```

---

## Full Testing (Optional)

For comprehensive testing of all 11 endpoints:

```bash
cd backend
python run_tests.py
```

This will test:
- ✅ Health check
- ✅ Model information
- ✅ Single predictions
- ✅ Historical data
- ✅ Stock information
- ✅ Batch predictions
- ✅ Asset listing
- ✅ Error handling

---

## Manual Browser Testing

While the server is running, open these URLs in your browser:

1. **Health Check**
   http://localhost:5000/api/health

2. **Get Prediction**
   http://localhost:5000/api/predict/SPY

3. **Model Info**
   http://localhost:5000/api/model/info

4. **List Assets**
   http://localhost:5000/api/assets

5. **Historical Data**
   http://localhost:5000/api/historical/SPY?period=1mo&interval=1d

---

## Troubleshooting

### Problem: "Could not connect to server"

**Solution:** Make sure Flask server is running
```bash
cd backend
python app.py
```

### Problem: "Model not found"

**Solution:** Train the model first
```bash
cd backend
python train_model.py
```

### Problem: "Port 5000 already in use"

**Solution:** Kill the process using port 5000 or change the port in `app.py`

**Windows - Find and kill process:**
```bash
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

---

## What Success Looks Like

✅ Quick test passes
✅ Server responds within 5 seconds
✅ Predictions show UP or DOWN
✅ Confidence is between 0-100%
✅ No error messages in server terminal

---

## Ready for Next Phase?

Once testing is complete and everything works:

✅ **Phase 1**: ML Model (51.88% accuracy) - COMPLETE
✅ **Phase 2**: Flask API Backend - COMPLETE
🔜 **Phase 3**: React Frontend - READY TO START

---

## Files Created for Testing

```
backend/
├── app.py                  # Main Flask API
├── quick_test.py          # Quick connectivity test
├── run_tests.py           # Comprehensive test suite
├── test_api.py            # Original test script
├── start_server.bat       # Windows batch file to start server
└── API_GUIDE.md           # Full API documentation
```

---

**Need help? Check `TESTING_GUIDE.md` for detailed instructions.**
