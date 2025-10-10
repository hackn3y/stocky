# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack machine learning stock predictor app with Flask backend and React frontend. Predicts next-day stock movement (UP/DOWN) using Random Forest classifiers trained on 30+ technical indicators.

**Key Features:**
- Stock predictions using trained ML models
- Cryptocurrency-specific models (BTC-USD, XRP-USD)
- User authentication with JWT tokens
- SQLite database with Peewee ORM
- News, search, and risk metrics endpoints

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

# Train/retrain stock ML model (creates models/spy_model.pkl)
python train_model.py

# Train crypto models (creates models/btc_usd_model.pkl, models/xrp_usd_model.pkl)
python train_crypto_models.py

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
- `app.py` - Flask REST API with 11+ endpoints (health, predict, historical, info, batch, assets, model/info, news, search, risk-metrics, auth)
- `predict.py` - Prediction logic with crypto/enhanced/original model routing
- `feature_engineering.py` - 30 technical indicators (RSI, MACD, Bollinger Bands, Stochastic, ATR, MFI, OBV, Williams %R, CCI, ROC, DI, patterns)
- `train_model.py` - Stock model training script (Random Forest, 300 estimators)
- `train_crypto_models.py` - Crypto model training (BTC-USD, XRP-USD with 500 estimators)
- `data_fetcher.py` - Downloads historical stock data via yfinance
- `auth.py` - User authentication blueprint (register, login, JWT tokens)
- `models.py` - Peewee ORM models for SQLite database
- `model_loader.py` - Smart model loader with GitHub LFS fallback
- `models/spy_model.pkl` - Trained stock model (51.88% test accuracy)
- `models/btc_usd_model.pkl` - Trained BTC model
- `models/xrp_usd_model.pkl` - Trained XRP model

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
- `JWT_SECRET_KEY` - Secret key for JWT token signing (optional, defaults to placeholder)

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

### Core Endpoints
```
GET  /api/health                    - Health check
GET  /api/model/info                - Model metadata
GET  /api/predict/<symbol>          - Get prediction for symbol (auto-selects crypto/stock model)
GET  /api/historical/<symbol>       - Historical OHLCV data (?period=3mo&interval=1d)
GET  /api/info/<symbol>             - Stock information (name, sector, exchange)
POST /api/predict/batch             - Batch predictions (body: {"symbols": ["SPY", "AAPL"]})
GET  /api/assets                    - List supported assets
```

### New Endpoints
```
GET  /api/news/<symbol>             - Get latest news for a stock (limit 10 articles)
GET  /api/search?q=<query>          - Search stocks by name or symbol
GET  /api/risk-metrics/<symbol>     - Calculate risk metrics (Sharpe, volatility, beta, VaR, max drawdown)
```

### Authentication Endpoints
```
POST /api/auth/register             - Register new user (body: {email, username, password})
POST /api/auth/login                - Login user (body: {email, password})
GET  /api/auth/me                   - Get current user profile (requires JWT token)
PUT  /api/auth/update               - Update user profile (requires JWT token)
GET  /api/auth/users                - Get all users (public data only)
POST /api/auth/follow/<user_id>     - Follow a user (requires JWT token)
POST /api/auth/unfollow/<user_id>   - Unfollow a user (requires JWT token)
```

## Model Performance

- **Test Accuracy**: 51.88% (trained on SPY)
- **Cross-Validation**: 46.9% (5-fold)
- **Algorithm**: Random Forest (300 estimators, class_weight='balanced')
- **Training Data**: ~2,708 days of SPY data
- **Note**: 52% is only slightly better than random (50%) - for educational purposes only

## Model Architecture & Routing

The prediction system automatically selects the appropriate model:

1. **Crypto Symbols** (contains `-USD`): Uses crypto-specific models
   - `BTC-USD` → `models/btc_usd_model.pkl` (500 estimators, optimized for crypto volatility)
   - `XRP-USD` → `models/xrp_usd_model.pkl` (500 estimators, optimized for crypto volatility)
   - Fallback to stock model if crypto model not found

2. **Stock Symbols**: Uses stock models in priority order
   - Try `models/enhanced_spy_model.pkl` (with additional features)
   - Fallback to `models/spy_model.pkl` (original 30 features)

3. **Model Loading**: `model_loader.py` handles GitHub LFS fallback
   - Detects if model file is an LFS pointer
   - Automatically downloads real model from GitHub if needed
   - Prevents corrupted LFS pointer files from breaking predictions

**Key Implementation:** `predict.py:12-37` (load_model function)

## Common Development Patterns

### Adding a New Technical Indicator

1. Add calculation to `feature_engineering.py`:
   ```python
   df['New_Indicator'] = <calculation>
   ```

2. Add to feature_cols in both `feature_engineering.py` (prepare_model_data) and `predict.py` (make_prediction)

3. Retrain model: `cd backend && python train_model.py`

### Training a New Crypto Model

1. Edit `train_crypto_models.py` to add new symbol
2. Run training: `cd backend && python train_crypto_models.py`
3. Model saved to `models/{symbol}_model.pkl` (e.g., `eth_usd_model.pkl`)
4. Prediction automatically uses crypto model when symbol contains `-USD`

### Adding Protected API Endpoints

1. Import decorator: `from auth import token_required`
2. Add decorator to route:
   ```python
   @app.route('/api/protected', methods=['GET'])
   @token_required
   def protected_route(current_user):
       # current_user is automatically injected
       return jsonify({'user': current_user.username})
   ```
3. Frontend must send JWT token in header: `Authorization: Bearer <token>`

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
4. Model is not LFS pointer: Check if `model_loader.py` is downloading from GitHub
5. Feature count matches: Model expects exactly 30 features for stock/crypto models
6. Check backend logs for detailed traceback (returned in API response)

### Working with Git LFS Models

Model files are stored in Git LFS (Large File Storage):

**If you clone the repo and models don't work:**
1. Check if model is LFS pointer: `head -n 3 backend/models/spy_model.pkl`
   - If you see `version https://git-lfs.github.com`, it's a pointer
2. Install Git LFS: `git lfs install`
3. Pull actual files: `git lfs pull`
4. Or let `model_loader.py` auto-download from GitHub on first prediction

**Deploying to Railway/Heroku:**
- Railway automatically handles Git LFS
- If models are pointers, `model_loader.py` downloads real files on first API call
- Models are cached after first download

## Technology Stack

- **Backend**: Flask, Flask-CORS, scikit-learn, yfinance, pandas, numpy, gunicorn
- **Database**: SQLite with Peewee ORM (pysqlite3-binary)
- **Authentication**: JWT (PyJWT), werkzeug password hashing
- **Frontend**: React 19, Tailwind CSS, Recharts, Axios, Lucide React (icons)
- **ML**: Random Forest Classifier (scikit-learn), Gradient Boosting (crypto models)
- **Deployment**: Railway (backend), Vercel (frontend)
- **Storage**: Git LFS for model files (.pkl files 40MB+)

## Database Schema

The SQLite database (`users.db`) contains user authentication and profile data:

**User Model** (`models.py:10-95`):
- `id` - Auto-increment primary key
- `email` - Unique user email
- `username` - Display name
- `password` - Hashed password (werkzeug)
- `watchlist` - JSON array of stock symbols
- `portfolio` - JSON array of portfolio items
- `predictions` - JSON array of prediction history
- `followers` - JSON array of user IDs
- `following` - JSON array of user IDs
- `alerts` - JSON array of price alerts
- `created_at` - Registration timestamp

Database auto-creates on first run. Located at `backend/users.db`.
