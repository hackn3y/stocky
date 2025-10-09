# Stock Prediction API Guide

## Quick Start

### 1. Start the Server
```bash
cd backend
python app.py
```

Server will be available at: `http://localhost:5000`

### 2. Test the API
```bash
# Health check
curl http://localhost:5000/api/health

# Get prediction
curl http://localhost:5000/api/predict/SPY

# Run full test suite
python test_api.py
```

---

## API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
No authentication required (development mode)

---

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T12:00:00",
  "version": "1.0.0"
}
```

---

### 2. Get Prediction
**GET** `/predict/<symbol>`

Get stock price direction prediction for the next trading day.

**Parameters:**
- `symbol` (path) - Stock ticker symbol (e.g., SPY, AAPL, MSFT)

**Example:**
```bash
curl http://localhost:5000/api/predict/SPY
```

**Response:**
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
  },
  "timestamp": "2025-10-09T12:00:00"
}
```

**Prediction Values:**
- `UP` - Model predicts price will go up
- `DOWN` - Model predicts price will go down

**Confidence:**
- Percentage (0-100) representing model certainty
- Higher confidence = stronger signal

---

### 3. Get Historical Data
**GET** `/historical/<symbol>`

Fetch historical OHLCV (Open, High, Low, Close, Volume) data.

**Parameters:**
- `symbol` (path) - Stock ticker symbol
- `period` (query, optional) - Time period
  - Options: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
  - Default: 1y
- `interval` (query, optional) - Data interval
  - Options: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
  - Default: 1d

**Example:**
```bash
curl "http://localhost:5000/api/historical/SPY?period=1mo&interval=1d"
```

**Response:**
```json
{
  "success": true,
  "symbol": "SPY",
  "period": "1mo",
  "interval": "1d",
  "data": {
    "dates": ["2025-09-09 00:00:00", "2025-09-10 00:00:00", ...],
    "open": [670.45, 669.99, ...],
    "high": [670.57, 672.68, ...],
    "low": [665.23, 668.01, ...],
    "close": [667.89, 671.23, ...],
    "volume": [45678900, 52341200, ...]
  },
  "data_points": 21,
  "timestamp": "2025-10-09T12:00:00"
}
```

---

### 4. Get Stock Information
**GET** `/info/<symbol>`

Get basic information about a stock or ETF.

**Parameters:**
- `symbol` (path) - Stock ticker symbol

**Example:**
```bash
curl http://localhost:5000/api/info/SPY
```

**Response:**
```json
{
  "success": true,
  "symbol": "SPY",
  "info": {
    "name": "SPDR S&P 500 ETF Trust",
    "sector": "N/A",
    "industry": "N/A",
    "marketCap": 500000000000,
    "description": "The SPDR S&P 500 ETF Trust seeks to provide...",
    "website": "https://www.ssga.com",
    "currency": "USD",
    "exchange": "PCX"
  },
  "timestamp": "2025-10-09T12:00:00"
}
```

---

### 5. Batch Predictions
**POST** `/predict/batch`

Get predictions for multiple symbols in one request.

**Request Body:**
```json
{
  "symbols": ["SPY", "QQQ", "VOO", "AAPL"]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["SPY", "QQQ", "VOO"]}'
```

**Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "symbol": "SPY",
      "prediction": "UP",
      "confidence": 63.83,
      "current_price": 673.11
    },
    {
      "symbol": "QQQ",
      "prediction": "DOWN",
      "confidence": 55.23,
      "current_price": 456.78
    }
  ],
  "errors": null,
  "timestamp": "2025-10-09T12:00:00"
}
```

---

### 6. List Supported Assets
**GET** `/assets`

Get list of supported asset classes and symbols.

**Example:**
```bash
curl http://localhost:5000/api/assets
```

**Response:**
```json
{
  "success": true,
  "assets": {
    "etfs": ["SPY", "IWF", "SCHD", "VOO", "QQQ"],
    "commodities": ["GLD", "SLV"],
    "crypto": ["BTC-USD", "ETH-USD"],
    "note": "Model is trained on SPY. Other assets may have varying accuracy."
  },
  "timestamp": "2025-10-09T12:00:00"
}
```

---

### 7. Model Information
**GET** `/model/info`

Get information about the trained ML model.

**Example:**
```bash
curl http://localhost:5000/api/model/info
```

**Response:**
```json
{
  "model_type": "RandomForestClassifier",
  "n_features": 30,
  "n_estimators": 300,
  "trained": true
}
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error description",
  "details": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (invalid endpoint or symbol)
- `500` - Internal Server Error

---

## Usage Examples

### Python
```python
import requests

# Get prediction
response = requests.get('http://localhost:5000/api/predict/SPY')
data = response.json()

if data['success']:
    print(f"Prediction: {data['prediction']}")
    print(f"Confidence: {data['confidence']}%")
```

### JavaScript (fetch)
```javascript
fetch('http://localhost:5000/api/predict/SPY')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log(`Prediction: ${data.prediction}`);
      console.log(`Confidence: ${data.confidence}%`);
    }
  });
```

### JavaScript (axios)
```javascript
const axios = require('axios');

axios.get('http://localhost:5000/api/predict/SPY')
  .then(response => {
    const data = response.data;
    console.log(`Prediction: ${data.prediction}`);
    console.log(`Confidence: ${data.confidence}%`);
  });
```

---

## Notes

- The model is trained primarily on SPY data
- Predictions are for educational purposes only
- Not financial advice - do not trade based solely on these predictions
- Accuracy is approximately 51-52% (slightly better than random)
- Server runs in debug mode - not for production use
- CORS is enabled for all origins (development only)

---

## Next Steps

1. ✅ Start the server
2. ✅ Test endpoints
3. 🔜 Build React frontend (Phase 3)
4. 🔜 Deploy to production server
5. 🔜 Add more assets and models
