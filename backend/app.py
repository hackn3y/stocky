from flask import Flask, jsonify, request
from flask_cors import CORS
from predict import make_prediction
import yfinance as yf
import joblib
from datetime import datetime, timedelta
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# Model info endpoint
@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about the trained model"""
    try:
        model = joblib.load('models/spy_model.pkl')
        return jsonify({
            'model_type': type(model).__name__,
            'n_features': model.n_features_in_,
            'n_estimators': getattr(model, 'n_estimators', None),
            'trained': True
        })
    except Exception as e:
        return jsonify({
            'error': 'Model not found or not loaded',
            'details': str(e)
        }), 404

# Prediction endpoint
@app.route('/api/predict/<symbol>', methods=['GET'])
def predict_stock(symbol):
    """
    Get prediction for a stock symbol

    Parameters:
    - symbol: Stock ticker (e.g., SPY, AAPL)

    Returns:
    - prediction: UP or DOWN
    - confidence: Probability percentage
    - current_price: Latest closing price
    - probabilities: Up and down probabilities
    """
    try:
        symbol = symbol.upper()
        result = make_prediction(symbol)

        return jsonify({
            'success': True,
            'symbol': result['symbol'],
            'prediction': result['prediction'],
            'confidence': round(result['confidence'], 2),
            'current_price': round(result['current_price'], 2),
            'probabilities': {
                'up': round(result['prob_up'] * 100, 2),
                'down': round(result['prob_down'] * 100, 2)
            },
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate prediction',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 400

# Historical data endpoint
@app.route('/api/historical/<symbol>', methods=['GET'])
def get_historical(symbol):
    """
    Get historical price data for a stock

    Parameters:
    - symbol: Stock ticker
    - period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
    - interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)

    Returns:
    - dates: List of dates
    - prices: Closing prices
    - volumes: Trading volumes
    - high: High prices
    - low: Low prices
    - open: Opening prices
    """
    try:
        symbol = symbol.upper()
        period = request.args.get('period', '1y')
        interval = request.args.get('interval', '1d')

        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period, interval=interval)

        if df.empty:
            return jsonify({
                'success': False,
                'error': f'No data found for symbol {symbol}'
            }), 404

        data = {
            'success': True,
            'symbol': symbol,
            'period': period,
            'interval': interval,
            'data': {
                'dates': df.index.strftime('%Y-%m-%d %H:%M:%S').tolist(),
                'open': df['Open'].round(2).tolist(),
                'high': df['High'].round(2).tolist(),
                'low': df['Low'].round(2).tolist(),
                'close': df['Close'].round(2).tolist(),
                'volume': df['Volume'].astype(int).tolist()
            },
            'data_points': len(df),
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(data)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch historical data',
            'details': str(e)
        }), 400

# Stock info endpoint
@app.route('/api/info/<symbol>', methods=['GET'])
def get_stock_info(symbol):
    """
    Get basic information about a stock

    Parameters:
    - symbol: Stock ticker

    Returns:
    - company name, sector, industry, market cap, etc.
    """
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        info = ticker.info

        return jsonify({
            'success': True,
            'symbol': symbol,
            'info': {
                'name': info.get('longName', info.get('shortName', 'N/A')),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'marketCap': info.get('marketCap', 'N/A'),
                'description': info.get('longBusinessSummary', 'N/A'),
                'website': info.get('website', 'N/A'),
                'currency': info.get('currency', 'USD'),
                'exchange': info.get('exchange', 'N/A')
            },
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch stock info',
            'details': str(e)
        }), 400

# Multiple symbols prediction endpoint
@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Get predictions for multiple symbols at once

    Body:
    {
        "symbols": ["SPY", "AAPL", "MSFT"]
    }

    Returns:
    - predictions for each symbol
    """
    try:
        data = request.get_json()

        if not data or 'symbols' not in data:
            return jsonify({
                'success': False,
                'error': 'Request body must contain "symbols" array'
            }), 400

        symbols = data['symbols']

        if not isinstance(symbols, list) or len(symbols) == 0:
            return jsonify({
                'success': False,
                'error': 'symbols must be a non-empty array'
            }), 400

        results = []
        errors = []

        for symbol in symbols:
            try:
                symbol = symbol.upper()
                result = make_prediction(symbol)
                results.append({
                    'symbol': result['symbol'],
                    'prediction': result['prediction'],
                    'confidence': round(result['confidence'], 2),
                    'current_price': round(result['current_price'], 2)
                })
            except Exception as e:
                errors.append({
                    'symbol': symbol,
                    'error': str(e)
                })

        return jsonify({
            'success': True,
            'predictions': results,
            'errors': errors if errors else None,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to process batch predictions',
            'details': str(e)
        }), 400

# List supported assets
@app.route('/api/assets', methods=['GET'])
def list_assets():
    """List of supported assets for prediction"""
    assets = {
        'etfs': ['SPY', 'IWF', 'SCHD', 'VOO', 'QQQ'],
        'commodities': ['GLD', 'SLV'],
        'crypto': ['BTC-USD', 'ETH-USD'],
        'note': 'Model is trained on SPY. Other assets may have varying accuracy.'
    }
    return jsonify({
        'success': True,
        'assets': assets,
        'timestamp': datetime.now().isoformat()
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested URL was not found on the server.'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred.'
    }), 500

if __name__ == '__main__':
    import os

    # Get port from environment variable (Railway/Heroku) or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') != 'production'

    print("="*60)
    print("Stock Prediction API Server")
    print("="*60)
    print("\nAvailable endpoints:")
    print("  GET  /api/health              - Health check")
    print("  GET  /api/model/info          - Model information")
    print("  GET  /api/predict/<symbol>    - Get prediction for symbol")
    print("  GET  /api/historical/<symbol> - Get historical data")
    print("  GET  /api/info/<symbol>       - Get stock information")
    print("  POST /api/predict/batch       - Batch predictions")
    print("  GET  /api/assets              - List supported assets")
    print(f"\nServer starting on port {port}")
    print("="*60 + "\n")

    app.run(debug=debug, port=port, host='0.0.0.0')
