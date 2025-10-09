# Stock Market Predictor

A full-stack machine learning application that predicts next-day stock price movements using a Random Forest classifier.

![Status](https://img.shields.io/badge/status-ready%20to%20deploy-green)
![Accuracy](https://img.shields.io/badge/accuracy-51.88%25-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![React](https://img.shields.io/badge/react-19-blue)

## Features

- 🤖 **Machine Learning**: Random Forest model with 51.88% test accuracy
- 🔮 **Stock Predictions**: Predicts UP/DOWN movement for next trading day
- 📊 **Technical Analysis**: Uses 30+ technical indicators (RSI, MACD, Bollinger Bands, etc.)
- 📈 **Interactive Charts**: 3-month historical price visualization
- 🌐 **REST API**: Flask backend with comprehensive endpoints
- ⚛️ **Modern UI**: React frontend with Tailwind CSS
- 🚀 **Production Ready**: Configured for Railway (backend) and Vercel (frontend)

## Tech Stack

### Backend
- **Python 3.11**
- **Flask** - REST API framework
- **scikit-learn** - Machine learning (Random Forest)
- **yfinance** - Real-time stock data
- **pandas/numpy** - Data processing
- **gunicorn** - Production server

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Axios** - API client
- **Lucide React** - Icons

## Project Structure

```
stocky/
├── backend/
│   ├── app.py                    # Flask API server
│   ├── train_model.py            # Model training script
│   ├── predict.py                # Prediction logic
│   ├── feature_engineering.py    # Technical indicators (30 features)
│   ├── data_fetcher.py           # Stock data downloader
│   ├── models/
│   │   └── spy_model.pkl         # Trained model
│   ├── requirements.txt          # Python dependencies
│   ├── Procfile                  # Railway deployment config
│   └── runtime.txt               # Python version
├── frontend/
│   ├── src/
│   │   ├── App.js                # Main React component
│   │   ├── index.js              # React entry point
│   │   └── index.css             # Tailwind styles
│   ├── public/
│   ├── package.json              # Node dependencies
│   ├── vercel.json               # Vercel deployment config
│   └── .env.example              # Environment variable template
├── DEPLOYMENT.md                 # Comprehensive deployment guide
├── RAILWAY_DEPLOY.md             # Quick Railway guide
└── VERCEL_DEPLOY.md              # Quick Vercel guide
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/stock-predictor.git
cd stock-predictor
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the model (optional - model is already included)
python train_model.py

# Run the server
python app.py
```

Backend will run at `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at `http://localhost:3000`

## API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/model/info` - Model information
- `GET /api/assets` - Supported assets

### Stock Data
- `GET /api/predict/<symbol>` - Get prediction for symbol
- `GET /api/historical/<symbol>?period=1y&interval=1d` - Historical data
- `GET /api/info/<symbol>` - Stock information
- `POST /api/predict/batch` - Batch predictions

### Example Request

```bash
curl http://localhost:5000/api/predict/SPY
```

### Example Response

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
  "timestamp": "2025-10-09T..."
}
```

## Machine Learning Model

### Features (30 total)
- Price-based: Returns, gaps, streaks
- Moving Averages: SMA_5, SMA_20, SMA_50, EMA_12, EMA_26
- Volatility: ATR, Bollinger Bands position
- Momentum: RSI, MACD, Stochastic, Williams %R, ROC
- Volume: OBV, MFI (Money Flow Index)
- Trend: CCI, DI_Diff (directional indicators)

### Performance
- **Test Accuracy**: 51.88%
- **Cross-Validation**: 46.9% (5-fold)
- **Model**: Random Forest (300 estimators, balanced weights)
- **Training Data**: SPY (2,708 days)

### Why 52% Accuracy?
Stock prediction is extremely difficult. Even 52% is better than random (50%) and can be profitable with proper risk management. This is for educational purposes only!

## Deployment

### Deploy to Production

See detailed guides:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide
- **[RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)** - Backend deployment (Railway)
- **[VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)** - Frontend deployment (Vercel)

### Quick Deployment Steps

1. **Backend (Railway)**
   - Push to GitHub
   - Connect Railway to your repo
   - Set root directory: `backend`
   - Generate domain
   - Get backend URL

2. **Frontend (Vercel)**
   - Connect Vercel to your repo
   - Set root directory: `frontend`
   - Add env var: `REACT_APP_API_URL=https://your-backend.railway.app/api`
   - Deploy
   - Get frontend URL

Both platforms offer free tiers and auto-deploy on Git push!

## Environment Variables

### Backend (Railway)
- `PORT` - Auto-set by Railway
- `FLASK_ENV=production` - Optional

### Frontend (Vercel)
- `REACT_APP_API_URL` - Backend API URL (required)

Example:
```
REACT_APP_API_URL=https://stock-api.up.railway.app/api
```

## Testing

### Backend Tests

```bash
cd backend
python test_api.py
```

### Manual API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Get prediction
curl http://localhost:5000/api/predict/SPY

# Historical data
curl http://localhost:5000/api/historical/AAPL?period=1mo
```

## Screenshots

### Main Interface
- Stock symbol search
- Prediction display (UP/DOWN with confidence)
- Current price and probabilities
- Stock information

### Historical Chart
- 3-month price history
- Interactive line chart
- Clean, modern design

## Supported Symbols

The model is trained on SPY but can predict any stock:

- **ETFs**: SPY, VOO, QQQ, IWF, SCHD
- **Stocks**: AAPL, MSFT, GOOGL, TSLA, etc.
- **Commodities**: GLD, SLV
- **Crypto**: BTC-USD, ETH-USD

⚠️ **Note**: Model accuracy varies by symbol. Best performance on SPY.

## Limitations & Disclaimer

⚠️ **IMPORTANT**: This is for educational purposes only!

- **Not financial advice** - Do not invest real money based on these predictions
- **52% accuracy** - Only slightly better than random chance
- **Past performance ≠ future results** - Markets are unpredictable
- **No guarantee** - Model can be wrong, especially during volatile periods
- **Use at your own risk** - Always do your own research

## Improving the Model

Want better predictions? Try:

1. **More data**: Train on 10+ years instead of ~5 years
2. **More features**: Add sentiment analysis, economic indicators
3. **Better algorithms**: Try LSTM, XGBoost, ensemble methods
4. **Feature selection**: Remove low-importance features
5. **Hyperparameter tuning**: Use GridSearchCV
6. **More assets**: Train separate models per stock
7. **Different targets**: Predict price ranges instead of binary UP/DOWN

## Contributing

Contributions welcome! Feel free to:

- Report bugs
- Suggest features
- Improve the model
- Add new technical indicators
- Enhance the UI

## License

MIT License - feel free to use for learning and personal projects!

## Acknowledgments

- **yfinance** - Free stock data
- **scikit-learn** - Machine learning library
- **Create React App** - React setup
- **Tailwind CSS** - Styling framework
- **Recharts** - Charting library

## Support

For issues or questions:
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
- Review API documentation in [backend/API_GUIDE.md](backend/API_GUIDE.md)
- Check browser console for frontend errors
- Review Railway/Vercel logs for backend errors

## What's Next?

After deployment:

1. ✅ Share your app with friends
2. ✅ Add more features (watchlists, alerts)
3. ✅ Improve the model accuracy
4. ✅ Add user authentication
5. ✅ Set up custom domain
6. ✅ Add more technical indicators
7. ✅ Train on more stocks

---

**Built with ❤️ using Python, React, and Machine Learning**

**Happy Predicting! 📈🚀**
