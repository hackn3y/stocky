# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack machine learning stock predictor app with Flask backend and React frontend. Predicts next-day stock movement (UP/DOWN) using a Random Forest classifier trained on 30+ technical indicators.

**Live Deployment:**
- Frontend: https://stocky-mu.vercel.app/ (Vercel)
- Backend: https://stocky-production-16bc.up.railway.app (Railway)

## Development Commands

### Backend (Python/Flask)

```bash
cd backend

# Activate virtual environment
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Run development server (http://localhost:5000)
python app.py

# Test API endpoints (requires running server)
python test_api.py

# Train/retrain ML model (creates models/spy_model.pkl)
python train_model.py

# Make single prediction
python predict.py
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Architecture Overview

### Backend Data Flow

1. **API Request** → `app.py` receives request for stock symbol
2. **Data Fetching** → `predict.py` calls `get_latest_data()` using yfinance (downloads 3 months of price data)
3. **Feature Engineering** → `feature_engineering.py` calculates 30 technical indicators from OHLCV data
4. **Prediction** → Loaded Random Forest model (`models/spy_model.pkl`) predicts UP/DOWN with probabilities
5. **Response** → JSON returned with prediction, confidence, current price, probabilities

**Key Files:**
- `app.py` - Flask REST API with 7 endpoints (health, predict, historical, info, batch, assets, model/info)
- `predict.py` - Prediction logic using trained model
- `feature_engineering.py` - 30 technical indicators (RSI, MACD, Bollinger Bands, Stochastic, ATR, MFI, OBV, Williams %R, CCI, ROC, DI, patterns)
- `train_model.py` - Model training script (Random Forest, 300 estimators)
- `data_fetcher.py` - Downloads historical stock data via yfinance
- `models/spy_model.pkl` - Trained model (51.88% test accuracy)

### Frontend Data Flow

1. **User Input** → Symbol entered in search box
2. **API Calls** → Three parallel axios requests:
   - `/api/predict/<symbol>` - Get prediction
   - `/api/historical/<symbol>?period=3mo&interval=1d` - Get chart data
   - `/api/info/<symbol>` - Get stock metadata
3. **State Updates** → React state updated with responses
4. **Rendering** → Display prediction cards + Recharts line chart

**Key Files:**
- `src/App.js` - Single-component React app with all UI logic
- `src/index.css` - Tailwind CSS styles
- `.env.local` - Contains `REACT_APP_API_URL` (required for API connection)

### ML Feature Pipeline

The model requires **exactly 30 features** in this order (from `feature_engineering.py` lines 155-176):

```python
feature_cols = [
    'RSI', 'BB_Position', 'Volume_Ratio',
    'SMA_5_20_Ratio', 'SMA_20_50_Ratio', 'Price_to_SMA5', 'Price_to_SMA20',
    'Daily_Return', 'Momentum_Pct', 'Volatility',
    'Return_2d', 'Return_5d', 'HL_Ratio', 'Volume_Change', 'Price_Acceleration',
    'MACD_Hist',
    'Stochastic', 'ATR_Pct', 'MFI', 'OBV_Ratio', 'Williams_R', 'CCI', 'ROC', 'DI_Diff',
    'Up_Streak', 'Down_Streak', 'Gap', 'Intraday_Range', 'Close_Position', 'Volume_Momentum'
]
```

**CRITICAL:** When modifying features, you must:
1. Update `feature_engineering.py` - Add/modify indicator calculation
2. Update `predict.py` - Match exact feature list
3. Retrain model - Run `python train_model.py`
4. Test prediction - Run `python predict.py`

## Environment Variables

### Backend (Railway)
- `PORT` - Auto-set by Railway (default: 5000 locally)
- `FLASK_ENV` - Set to `production` for deployed environment

### Frontend (Vercel)
- `REACT_APP_API_URL` - **REQUIRED**: Backend API URL (e.g., `https://stocky-production-16bc.up.railway.app/api`)

## Deployment Configuration

### Backend (Railway)
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn app:app` (from Procfile)
- Python Version: 3.11 (from runtime.txt)

### Frontend (Vercel)
- Root Directory: `frontend`
- Framework: Create React App (auto-detected)
- Build Command: `npm run build` (auto-detected)
- Output Directory: `build`

**Important:** The root `.gitignore` uses `/package.json` and `/package-lock.json` (with leading slash) to ignore only root-level package files, not `frontend/package.json` which is required for Vercel deployment.

## API Endpoints Reference

```
GET  /api/health                    - Health check
GET  /api/model/info                - Model metadata
GET  /api/predict/<symbol>          - Get prediction for symbol
GET  /api/historical/<symbol>       - Historical OHLCV data (?period=3mo&interval=1d)
GET  /api/info/<symbol>             - Stock information (name, sector, exchange)
POST /api/predict/batch             - Batch predictions (body: {"symbols": ["SPY", "AAPL"]})
GET  /api/assets                    - List supported assets
```

## Model Performance

- **Test Accuracy**: 51.88% (trained on SPY)
- **Cross-Validation**: 46.9% (5-fold)
- **Algorithm**: Random Forest (300 estimators, class_weight='balanced')
- **Training Data**: ~2,708 days of SPY data
- **Note**: 52% is only slightly better than random (50%) - for educational purposes only

## Common Development Patterns

### Adding a New Technical Indicator

1. Add calculation to `feature_engineering.py`:
   ```python
   df['New_Indicator'] = <calculation>
   ```

2. Add to feature_cols in both `feature_engineering.py` (prepare_model_data) and `predict.py` (make_prediction)

3. Retrain model: `cd backend && python train_model.py`

### Testing Backend Changes Locally

1. Start backend: `cd backend && python app.py`
2. Start frontend: `cd frontend && npm start`
3. Frontend will use `http://localhost:5000/api` (fallback in App.js line 7)
4. Or run API tests: `python test_api.py`

### Debugging Prediction Issues

If predictions fail, check in this order:
1. yfinance can download data: `python -c "import yfinance; print(yfinance.Ticker('SPY').history(period='3mo'))"`
2. Feature calculation works: Check for NaN values in technical indicators
3. Model file exists: `backend/models/spy_model.pkl` (46MB file)
4. Feature count matches: Model expects exactly 30 features
5. Check backend logs for detailed traceback (returned in API response)

## Technology Stack

- **Backend**: Flask, scikit-learn, yfinance, pandas, numpy, gunicorn, peewee (ORM), pysqlite3-binary
- **Frontend**: React 19, Tailwind CSS, Recharts, Axios, Lucide React (icons)
- **ML**: Random Forest Classifier (scikit-learn)
- **Deployment**: Railway (backend), Vercel (frontend)
