# Stock Predictor API Documentation

Complete API reference for the Stock Market Predictor backend.

**Base URL (Production):** `https://stocky-production-16bc.up.railway.app/api`
**Base URL (Local):** `http://localhost:5000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Health & Status](#health--status)
  - [Predictions](#predictions)
  - [Stock Data](#stock-data)
  - [Model Information](#model-information)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Examples](#examples)

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Endpoints

### Health & Status

#### GET /api/health

Check if the API server is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T06:30:00.123456",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200 OK` - Server is healthy

---

### Predictions

#### GET /api/predict/:symbol

Get next-day price movement prediction for a stock symbol.

**Parameters:**
- `symbol` (path parameter, required) - Stock ticker symbol (e.g., SPY, AAPL, TSLA)

**Example Request:**
```bash
curl https://stocky-production-16bc.up.railway.app/api/predict/SPY
```

**Success Response (200):**
```json
{
  "success": true,
  "symbol": "SPY",
  "prediction": "UP",
  "confidence": 52.3,
  "current_price": 450.25,
  "probabilities": {
    "up": 52.3,
    "down": 47.7
  },
  "timestamp": "2025-10-09T06:30:00.123456"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Failed to generate prediction",
  "details": "No data available for symbol XYZ",
  "traceback": "..."
}
```

**Field Descriptions:**
- `prediction` - "UP" or "DOWN" for next trading day
- `confidence` - Highest probability percentage (0-100)
- `current_price` - Most recent closing price
- `probabilities.up` - Probability of upward movement (0-100)
- `probabilities.down` - Probability of downward movement (0-100)

---

#### POST /api/predict/batch

Get predictions for multiple stock symbols in a single request.

**Request Body:**
```json
{
  "symbols": ["SPY", "AAPL", "MSFT", "TSLA"]
}
```

**Example Request:**
```bash
curl -X POST https://stocky-production-16bc.up.railway.app/api/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["SPY", "QQQ", "VOO"]}'
```

**Success Response (200):**
```json
{
  "success": true,
  "predictions": [
    {
      "symbol": "SPY",
      "prediction": "UP",
      "confidence": 52.3,
      "current_price": 450.25
    },
    {
      "symbol": "QQQ",
      "prediction": "DOWN",
      "confidence": 51.8,
      "current_price": 380.50
    }
  ],
  "errors": [
    {
      "symbol": "INVALID",
      "error": "No data found for symbol"
    }
  ],
  "timestamp": "2025-10-09T06:30:00.123456"
}
```

**Validation:**
- `symbols` must be an array
- Array cannot be empty
- Maximum recommended: 10 symbols per request

---

### Stock Data

#### GET /api/historical/:symbol

Get historical OHLCV (Open, High, Low, Close, Volume) data for a stock.

**Parameters:**
- `symbol` (path parameter, required) - Stock ticker symbol
- `period` (query parameter, optional) - Time period. Default: `1y`
  - Valid values: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`
- `interval` (query parameter, optional) - Data interval. Default: `1d`
  - Valid values: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo`

**Example Request:**
```bash
curl "https://stocky-production-16bc.up.railway.app/api/historical/SPY?period=3mo&interval=1d"
```

**Success Response (200):**
```json
{
  "success": true,
  "symbol": "SPY",
  "period": "3mo",
  "interval": "1d",
  "data": {
    "dates": ["2025-07-09 00:00:00", "2025-07-10 00:00:00", ...],
    "open": [448.50, 449.25, ...],
    "high": [450.75, 451.00, ...],
    "low": [447.25, 448.50, ...],
    "close": [449.50, 450.25, ...],
    "volume": [75000000, 68000000, ...]
  },
  "data_points": 63,
  "timestamp": "2025-10-09T06:30:00.123456"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "No data found for symbol INVALID"
}
```

---

#### GET /api/info/:symbol

Get detailed information about a stock (company name, sector, industry, etc.).

**Parameters:**
- `symbol` (path parameter, required) - Stock ticker symbol

**Example Request:**
```bash
curl https://stocky-production-16bc.up.railway.app/api/info/AAPL
```

**Success Response (200):**
```json
{
  "success": true,
  "symbol": "AAPL",
  "info": {
    "name": "Apple Inc.",
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "marketCap": 2800000000000,
    "description": "Apple Inc. designs, manufactures, and markets smartphones...",
    "website": "https://www.apple.com",
    "currency": "USD",
    "exchange": "NMS"
  },
  "timestamp": "2025-10-09T06:30:00.123456"
}
```

**Note:** Some fields may return "N/A" if data is unavailable for the symbol.

---

#### GET /api/assets

Get list of supported assets and recommendations.

**Example Request:**
```bash
curl https://stocky-production-16bc.up.railway.app/api/assets
```

**Success Response (200):**
```json
{
  "success": true,
  "assets": {
    "etfs": ["SPY", "IWF", "SCHD", "VOO", "QQQ"],
    "commodities": ["GLD", "SLV"],
    "crypto": ["BTC-USD", "ETH-USD"],
    "note": "Model is trained on SPY. Other assets may have varying accuracy."
  },
  "timestamp": "2025-10-09T06:30:00.123456"
}
```

---

### Model Information

#### GET /api/model/info

Get information about the trained machine learning model.

**Example Request:**
```bash
curl https://stocky-production-16bc.up.railway.app/api/model/info
```

**Success Response (200):**
```json
{
  "model_type": "RandomForestClassifier",
  "n_features": 30,
  "n_estimators": 300,
  "trained": true
}
```

**Error Response (404):**
```json
{
  "error": "Model not found or not loaded",
  "details": "..."
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": "Technical details about the error",
  "traceback": "Full stack trace (only in development mode)"
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `400 Bad Request` - Invalid request parameters or body
- `404 Not Found` - Resource not found (e.g., invalid symbol, missing model)
- `500 Internal Server Error` - Unexpected server error

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No data found for symbol" | Invalid ticker symbol | Verify symbol is correct and tradable |
| "Failed to generate prediction" | Model error or insufficient data | Check if symbol has enough historical data |
| "Model not found or not loaded" | Missing model file | Ensure `models/spy_model.pkl` exists |
| "Request body must contain 'symbols' array" | Invalid batch request | Send proper JSON with symbols array |

---

## Rate Limits

Currently, there are **no enforced rate limits**. However, please be considerate:

- Recommended: Max 60 requests per minute
- Batch endpoints: Use for multiple symbols instead of individual requests
- Cache responses when possible (prediction data is static for a given day)

---

## Examples

### Python (using requests)

```python
import requests

# Single prediction
response = requests.get('https://stocky-production-16bc.up.railway.app/api/predict/SPY')
data = response.json()
print(f"Prediction: {data['prediction']}, Confidence: {data['confidence']}%")

# Batch predictions
response = requests.post(
    'https://stocky-production-16bc.up.railway.app/api/predict/batch',
    json={'symbols': ['SPY', 'AAPL', 'MSFT']}
)
data = response.json()
for pred in data['predictions']:
    print(f"{pred['symbol']}: {pred['prediction']} ({pred['confidence']}%)")

# Historical data
response = requests.get(
    'https://stocky-production-16bc.up.railway.app/api/historical/SPY',
    params={'period': '1mo', 'interval': '1d'}
)
data = response.json()
print(f"Data points: {data['data_points']}")
```

### JavaScript (using fetch)

```javascript
// Single prediction
const response = await fetch('https://stocky-production-16bc.up.railway.app/api/predict/SPY');
const data = await response.json();
console.log(`Prediction: ${data.prediction}, Confidence: ${data.confidence}%`);

// Batch predictions
const response = await fetch('https://stocky-production-16bc.up.railway.app/api/predict/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: ['SPY', 'AAPL', 'MSFT'] })
});
const data = await response.json();
data.predictions.forEach(pred => {
  console.log(`${pred.symbol}: ${pred.prediction} (${pred.confidence}%)`);
});

// Historical data
const response = await fetch(
  'https://stocky-production-16bc.up.railway.app/api/historical/SPY?period=1mo&interval=1d'
);
const data = await response.json();
console.log(`Data points: ${data.data_points}`);
```

### cURL

```bash
# Health check
curl https://stocky-production-16bc.up.railway.app/api/health

# Single prediction
curl https://stocky-production-16bc.up.railway.app/api/predict/SPY

# Batch predictions
curl -X POST https://stocky-production-16bc.up.railway.app/api/predict/batch \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["SPY", "AAPL", "MSFT"]}'

# Historical data
curl "https://stocky-production-16bc.up.railway.app/api/historical/SPY?period=1mo&interval=1d"

# Stock info
curl https://stocky-production-16bc.up.railway.app/api/info/AAPL

# Model info
curl https://stocky-production-16bc.up.railway.app/api/model/info
```

---

## Technical Details

### Machine Learning Model

- **Algorithm:** Random Forest Classifier
- **Features:** 30 technical indicators
  - Momentum: RSI, MACD, Stochastic, Williams %R, ROC
  - Moving Averages: SMA (5, 20, 50), EMA (12, 26)
  - Volatility: Bollinger Bands, ATR
  - Volume: OBV, MFI
  - Trend: CCI, Directional Indicators
  - Patterns: Streaks, gaps, ranges
- **Training Data:** ~2,708 days of SPY historical data
- **Test Accuracy:** 51.88%
- **Cross-Validation:** 46.9% (5-fold)

### Data Source

- **Provider:** Yahoo Finance (via `yfinance` library)
- **Update Frequency:** Real-time (fetched on each request)
- **Historical Range:** Up to 10+ years depending on symbol

### Response Times

- **Prediction:** ~2-5 seconds (includes data download + feature calculation)
- **Historical Data:** ~1-3 seconds
- **Stock Info:** ~1-2 seconds
- **Health Check:** <100ms

---

## Support

For issues or questions:
- Check [CLAUDE.md](../CLAUDE.md) for development guidance
- Review [README.md](../README.md) for general information
- Check Railway logs for server errors
- Test endpoints locally using `python test_api.py`

---

## Disclaimer

**This API is for educational purposes only.**

- Not financial advice
- 52% accuracy is only slightly better than random chance
- Do not invest real money based on these predictions
- Past performance does not guarantee future results
- Use at your own risk

---

**Last Updated:** October 2025
**API Version:** 1.0.0
