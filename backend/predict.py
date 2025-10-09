import yfinance as yf
import pandas as pd
import joblib
from feature_engineering import calculate_technical_indicators

def load_model():
    """Load trained model"""
    return joblib.load('models/spy_model.pkl')

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

    # Get latest features (must match training features)
    feature_cols = [
        # Original normalized features
        'RSI', 'BB_Position', 'Volume_Ratio',
        'SMA_5_20_Ratio', 'SMA_20_50_Ratio',
        'Price_to_SMA5', 'Price_to_SMA20',

        # Percentage-based features
        'Daily_Return', 'Momentum_Pct', 'Volatility',
        'Return_2d', 'Return_5d', 'HL_Ratio',
        'Volume_Change', 'Price_Acceleration',

        # MACD
        'MACD_Hist',

        # Advanced technical indicators
        'Stochastic', 'ATR_Pct', 'MFI', 'OBV_Ratio',
        'Williams_R', 'CCI', 'ROC', 'DI_Diff',

        # Pattern features
        'Up_Streak', 'Down_Streak', 'Gap',
        'Intraday_Range', 'Close_Position', 'Volume_Momentum',
    ]

    latest_features = df[feature_cols].iloc[-1:]

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
