import yfinance as yf
import pandas as pd
import joblib
import os
from feature_engineering import calculate_technical_indicators, prepare_model_data
from model_loader import load_model_safe

def load_model():
    """Load trained model - enhanced if available, else original"""
    enhanced_model_path = 'models/enhanced_spy_model.pkl'
    original_model_path = 'models/spy_model.pkl'

    # Try enhanced model first
    if os.path.exists(enhanced_model_path):
        try:
            print("Loading enhanced model...")
            return load_model_safe(enhanced_model_path), 'enhanced'
        except Exception as e:
            print(f"Failed to load enhanced model: {e}")

    # Fall back to original
    print("Loading original model...")
    return load_model_safe(original_model_path), 'original'

def get_latest_data(symbol='SPY', period='2y'):
    """Get recent data for prediction"""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period)
    return df

def make_prediction(symbol='SPY'):
    """Make prediction for next trading day"""

    # Load model
    model_data, model_type = load_model()

    # Get latest data
    df = get_latest_data(symbol)

    if df.empty:
        raise ValueError(f"No data found for symbol {symbol}")

    # Calculate features
    df = calculate_technical_indicators(df)

    if model_type == 'enhanced':
        try:
            # Import enhanced model features
            from enhanced_model import EnhancedStockPredictor

            # Add enhanced features
            predictor = EnhancedStockPredictor()
            df = predictor.add_engineered_features(df)

            # Prepare features
            X, _, df_clean = prepare_model_data(df)

            # Add enhanced features to X
            enhanced_features = [
                'Market_Regime', 'Trend_Strength', 'VP_Divergence',
                'Momentum_Quality', 'Distance_to_High', 'Distance_to_Low',
                'Volatility_Change', 'Price_Efficiency', 'Volume_Profile', 'Fear_Greed'
            ]

            for feat in enhanced_features:
                if feat in df_clean.columns:
                    X[feat] = df_clean[feat]

            # Remove any remaining NaNs
            mask = ~(X.isna().any(axis=1))
            X = X[mask]

            if X.empty:
                raise ValueError("Insufficient data for prediction")

            # Get the latest row for prediction
            X_latest = X.iloc[[-1]]  # Keep as DataFrame

            # Scale and select features
            X_latest_scaled = model_data['scaler'].transform(X_latest)
            X_latest_selected = model_data['feature_selector'].transform(X_latest_scaled)

            # Make prediction with ensemble
            model = model_data['ensemble']
            prediction = model.predict(X_latest_selected)[0]
            probabilities = model.predict_proba(X_latest_selected)[0]

            print(f"Using enhanced model (accuracy: {model_data.get('accuracy', 'N/A'):.2%})")

        except Exception as e:
            print(f"Error using enhanced model, falling back to original: {e}")
            model_type = 'original'

    if model_type == 'original':
        # Original model prediction logic
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
        model = model_data if isinstance(model_data, type(model_data).__class__) else model_data
        prediction = model.predict(latest_features)[0]
        probabilities = model.predict_proba(latest_features)[0]

        print(f"Using original model")

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