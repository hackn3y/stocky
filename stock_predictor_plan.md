# Stock Market Predictor App - Beginner's Implementation Guide

## Starting Simple: SPY-Only MVP

We'll build a working prediction app for SPY first, then expand to other assets (IWF, SCHD, VOO, gold, silver, crypto) once the foundation works.

## Simplified Tech Stack

### Backend (Python)
- **Framework**: Flask (simpler than FastAPI for beginners)
- **ML**: scikit-learn with RandomForestClassifier
- **Data**: yfinance (free stock data)
- **Analysis**: pandas, numpy
- **Storage**: SQLite (simple, no setup needed)

### Frontend (JavaScript)
- **Framework**: React (create-react-app)
- **Charts**: Recharts (easy to use)
- **Styling**: Tailwind CSS
- **HTTP**: Axios

### Development Tools
- **Version Control**: Git + GitHub
- **Environment**: Python venv, Node.js
- **Testing**: Start simple, add later

## Phase 1: Build the ML Model First (Week 1-2)
**Goal**: Get a working prediction model before building any web app

### Step 1.1: Setup Development Environment

```bash
# Create project folder
mkdir spy-predictor
cd spy-predictor

# Create Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install required packages
pip install pandas numpy scikit-learn yfinance matplotlib seaborn jupyter
```

### Step 1.2: Data Collection Script

Create `data_fetcher.py`:

```python
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def fetch_spy_data(start_date='2015-01-01'):
    """Fetch historical SPY data"""
    spy = yf.Ticker("SPY")
    df = spy.history(start=start_date, end=datetime.now())
    return df

def save_data(df, filename='spy_data.csv'):
    """Save data to CSV"""
    df.to_csv(filename)
    print(f"Saved {len(df)} rows to {filename}")

if __name__ == "__main__":
    data = fetch_spy_data()
    save_data(data)
    print(data.tail())
```

### Step 1.3: Feature Engineering Script

Create `feature_engineering.py`:

```python
import pandas as pd
import numpy as np

def calculate_technical_indicators(df):
    """Calculate technical indicators for ML features"""
    
    # Simple Moving Averages
    df['SMA_5'] = df['Close'].rolling(window=5).mean()
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    
    # Exponential Moving Average
    df['EMA_12'] = df['Close'].ewm(span=12, adjust=False).mean()
    df['EMA_26'] = df['Close'].ewm(span=26, adjust=False).mean()
    
    # MACD
    df['MACD'] = df['EMA_12'] - df['EMA_26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9, adjust=False).mean()
    
    # RSI (Relative Strength Index)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Bollinger Bands
    df['BB_Middle'] = df['Close'].rolling(window=20).mean()
    bb_std = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
    df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
    
    # Price momentum
    df['Momentum'] = df['Close'] - df['Close'].shift(10)
    
    # Volume indicators
    df['Volume_SMA'] = df['Volume'].rolling(window=20).mean()
    df['Volume_Ratio'] = df['Volume'] / df['Volume_SMA']
    
    # Daily returns
    df['Daily_Return'] = df['Close'].pct_change()
    
    # Target: Next day direction (1 = up, 0 = down)
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)
    
    return df

def prepare_model_data(df):
    """Prepare data for model training"""
    
    # Feature columns
    feature_cols = [
        'SMA_5', 'SMA_20', 'SMA_50',
        'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal',
        'RSI', 'BB_Upper', 'BB_Lower',
        'Momentum', 'Volume_Ratio', 'Daily_Return'
    ]
    
    # Remove NaN values
    df = df.dropna()
    
    X = df[feature_cols]
    y = df['Target']
    
    return X, y, df

if __name__ == "__main__":
    # Load data
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)
    
    # Calculate features
    df = calculate_technical_indicators(df)
    
    # Prepare for modeling
    X, y, df_clean = prepare_model_data(df)
    
    print(f"Features shape: {X.shape}")
    print(f"Target distribution:\n{y.value_counts()}")
    print(f"\nFeature columns:\n{X.columns.tolist()}")
```

### Step 1.4: Train ML Model

Create `train_model.py`:

```python
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
from feature_engineering import calculate_technical_indicators, prepare_model_data

def train_random_forest(X_train, y_train):
    """Train Random Forest model"""
    
    # Initialize Random Forest
    rf_model = RandomForestClassifier(
        n_estimators=200,      # Number of trees
        max_depth=15,          # Maximum depth of trees
        min_samples_split=10,  # Minimum samples to split a node
        min_samples_leaf=5,    # Minimum samples in leaf node
        random_state=42,
        n_jobs=-1              # Use all CPU cores
    )
    
    # Train model
    print("Training Random Forest model...")
    rf_model.fit(X_train, y_train)
    
    return rf_model

def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n=== Model Performance ===")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=['Down', 'Up']))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    return accuracy

def feature_importance(model, feature_names):
    """Show feature importance"""
    
    importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)
    
    print("\n=== Feature Importance ===")
    print(importance_df)
    
    return importance_df

if __name__ == "__main__":
    # Load and prepare data
    print("Loading data...")
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)
    df = calculate_technical_indicators(df)
    X, y, df_clean = prepare_model_data(df)
    
    # Split data (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False  # Don't shuffle time series!
    )
    
    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")
    
    # Train model
    model = train_random_forest(X_train, y_train)
    
    # Evaluate
    accuracy = evaluate_model(model, X_test, y_test)
    
    # Feature importance
    feature_importance(model, X.columns)
    
    # Cross-validation
    print("\n=== Cross-Validation ===")
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    print(f"CV Scores: {cv_scores}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
    
    # Save model
    joblib.dump(model, 'spy_model.pkl')
    print("\nModel saved as 'spy_model.pkl'")
```

### Step 1.5: Create Prediction Script

Create `predict.py`:

```python
import yfinance as yf
import pandas as pd
import joblib
from feature_engineering import calculate_technical_indicators

def load_model():
    """Load trained model"""
    return joblib.load('spy_model.pkl')

def get_latest_data(symbol='SPY', period='3mo'):
    """Get recent data for prediction"""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    return df

def make_prediction(symbol='SPY'):
    """Make prediction for next trading day"""
    
    # Load model
    model = load_model()
    
    # Get latest data
    df = get_latest_data(symbol)
    
    # Calculate features
    df = calculate_technical_indicators(df)
    df = df.dropna()
    
    # Get latest features
    feature_cols = [
        'SMA_5', 'SMA_20', 'SMA_50',
        'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal',
        'RSI', 'BB_Upper', 'BB_Lower',
        'Momentum', 'Volume_Ratio', 'Daily_Return'
    ]
    
    latest_features = df[feature_cols].iloc[-1:].values
    
    # Make prediction
    prediction = model.predict(latest_features)[0]
    probabilities = model.predict_proba(latest_features)[0]
    
    # Format output
    direction = "UP" if prediction == 1 else "DOWN"
    confidence = max(probabilities) * 100
    
    print(f"\n=== {symbol} Prediction ===")
    print(f"Current Price: ${df['Close'].iloc[-1]:.2f}")
    print(f"Prediction: {direction}")
    print(f"Confidence: {confidence:.2f}%")
    print(f"Probability Up: {probabilities[1]*100:.2f}%")
    print(f"Probability Down: {probabilities[0]*100:.2f}%")
    
    return {
        'symbol': symbol,
        'prediction': direction,
        'confidence': confidence,
        'current_price': df['Close'].iloc[-1],
        'prob_up': probabilities[1],
        'prob_down': probabilities[0]
    }

if __name__ == "__main__":
    result = make_prediction('SPY')
```

### What You'll Learn in Phase 1
- How to fetch stock data
- Calculate technical indicators
- Train a Random Forest model
- Evaluate model accuracy
- Make predictions

**Expected Results**: You should get 52-58% accuracy (anything above 50% is better than random guessing in stock prediction!)

---

## Phase 2: Simple Flask API (Week 3)
**Goal**: Create a basic API to serve predictions

### Step 2.1: Setup Flask

```bash
pip install flask flask-cors
```

Create `app.py`:

```python
from flask import Flask, jsonify, request
from flask_cors import CORS
from predict import make_prediction
import yfinance as yf

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/api/predict/<symbol>', methods=['GET'])
def predict_stock(symbol):
    try:
        result = make_prediction(symbol.upper())
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/historical/<symbol>', methods=['GET'])
def get_historical(symbol):
    try:
        period = request.args.get('period', '1y')
        ticker = yf.Ticker(symbol.upper())
        df = ticker.history(period=period)
        
        data = {
            'dates': df.index.strftime('%Y-%m-%d').tolist(),
            'prices': df['Close'].tolist(),
            'volumes': df['Volume'].tolist()
        }
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

Test it:
```bash
python app.py

# In another terminal:
curl http://localhost:5000/api/health
curl http://localhost:5000/api/predict/SPY
```

---

## Phase 3: React Frontend (Week 4-5)
**Goal**: Build a simple UI to display predictions

### Step 3.1: Create React App

```bash
npx create-react-app frontend
cd frontend
npm install axios recharts lucide-react
npm install -D tailwindcss
npx tailwindcss init
```

### Step 3.2: Basic App Structure

Create `src/App.js`:

```javascript
import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [symbol, setSymbol] = useState('SPY');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const getPrediction = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/predict/${symbol}`);
      setPrediction(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get prediction');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Stock Prediction App
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="border-2 border-gray-300 rounded px-4 py-2 flex-1"
              placeholder="Enter symbol (e.g., SPY)"
            />
            <button
              onClick={getPrediction}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Predict'}
            </button>
          </div>

          {prediction && (
            <div className="mt-6 p-4 bg-gray-50 rounded">
              <h2 className="text-2xl font-bold mb-4">{prediction.symbol}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Current Price</p>
                  <p className="text-xl font-semibold">${prediction.current_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Prediction</p>
                  <p className={`text-2xl font-bold ${prediction.prediction === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                    {prediction.prediction}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Confidence</p>
                  <p className="text-xl font-semibold">{prediction.confidence.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Probability Up</p>
                  <p className="text-xl font-semibold text-green-600">{(prediction.prob_up * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## Phase 4: Expand to Multiple Assets (Week 6)

Once SPY works, add support for your other assets:

### Modify `train_model.py` to support multiple symbols:

```python
SYMBOLS = ['SPY', 'IWF', 'SCHD', 'VOO', 'GLD', 'SLV', 'BTC-USD', 'ETH-USD']

for symbol in SYMBOLS:
    print(f"\nTraining model for {symbol}...")
    # Fetch data, train, save model as f'{symbol}_model.pkl'
```

### Key Differences by Asset Type:
- **ETFs (SPY, IWF, SCHD, VOO)**: Very similar, same features work
- **Commodities (Gold, Silver)**: Use GLD and SLV ETFs as proxies
- **Crypto (BTC, ETH)**: More volatile, may need different features (24/7 trading, social sentiment)

---

## Complete Project Structure

```
spy-predictor/
├── backend/
│   ├── data_fetcher.py
│   ├── feature_engineering.py
│   ├── train_model.py
│   ├── predict.py
│   ├── app.py
│   ├── requirements.txt
│   └── models/
│       └── spy_model.pkl
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── index.js
│   ├── package.json
│   └── public/
└── README.md
```

---

## Learning Resources

### Python & ML Basics
- **Scikit-learn docs**: https://scikit-learn.org/
- **Pandas tutorial**: https://pandas.pydata.org/docs/getting_started/intro_tutorials/
- **Random Forest explained**: Search for "StatQuest Random Forest" on YouTube

### React Basics
- **React official tutorial**: https://react.dev/learn
- **Recharts docs**: https://recharts.org/

### Stock Market Concepts
- **Technical indicators**: Investopedia.com
- **Understanding candlestick charts**
- **What is RSI, MACD, Bollinger Bands**

---

## Important Disclaimers

⚠️ **This is for educational purposes only**
- Not financial advice
- Past performance doesn't guarantee future results
- Don't risk real money based on these predictions
- Markets are extremely complex and hard to predict

---

## Next Steps - Start Here!

1. **Install Python and create virtual environment**
2. **Run `data_fetcher.py` to get SPY data**
3. **Run `feature_engineering.py` to see calculated indicators**
4. **Run `train_model.py` and check your accuracy**
5. **Try `predict.py` to make a prediction**
6. **Build Flask API once predictions work**
7. **Create React frontend last**

## Questions to Answer Before Starting

1. **Do you have Python 3.8+ installed?**
2. **Are you comfortable with command line?**
3. **Do you want to use Jupyter notebooks for exploration first?** (I'd recommend this!)
4. **Should I provide code for just the ML part first to get something working quickly?**

Would you like me to create actual runnable code files for Phase 1 so you can start immediately?