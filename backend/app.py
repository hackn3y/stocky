from flask import Flask, jsonify, request
from flask_cors import CORS
from predict import make_prediction
import yfinance as yf
import joblib
from datetime import datetime, timedelta
import traceback
from auth import auth_bp  # Import auth blueprint

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Register auth blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Check if API is running"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.1.0'
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

# Stock news endpoint
@app.route('/api/news/<symbol>', methods=['GET'])
def get_stock_news(symbol):
    """
    Get latest news for a stock symbol

    Parameters:
    - symbol: Stock ticker

    Returns:
    - news: List of news articles with title, publisher, link, publish time
    """
    try:
        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        news = ticker.news

        if not news:
            return jsonify({
                'success': True,
                'symbol': symbol,
                'news': [],
                'message': 'No news available for this symbol'
            })

        # Format news data - limit to 10 most recent articles
        formatted_news = []
        for article in news[:10]:
            # Handle both old and new yfinance news format
            content = article.get('content', article)

            # Get title
            title = content.get('title', article.get('title', 'No title'))

            # Get publisher
            provider = content.get('provider', {})
            publisher = provider.get('displayName', article.get('publisher', 'Unknown'))

            # Get link
            canonical_url = content.get('canonicalUrl', {})
            link = canonical_url.get('url', article.get('link', ''))

            # Get publish time
            pub_date = content.get('pubDate', content.get('displayTime'))
            if pub_date:
                # pubDate is already in ISO format (e.g., '2025-10-09T13:22:26Z')
                publish_time = pub_date
            else:
                # Fallback to old format (Unix timestamp)
                pub_time = article.get('providerPublishTime')
                publish_time = datetime.fromtimestamp(pub_time).isoformat() if pub_time else None

            # Get thumbnail
            thumbnail_url = ''
            if content.get('thumbnail'):
                thumbnail_url = content['thumbnail'].get('url', '')
            elif article.get('thumbnail'):
                resolutions = article['thumbnail'].get('resolutions', [])
                if resolutions:
                    thumbnail_url = resolutions[0].get('url', '')

            formatted_news.append({
                'title': title,
                'publisher': publisher,
                'link': link,
                'publish_time': publish_time,
                'type': content.get('contentType', article.get('type', 'STORY')),
                'thumbnail': thumbnail_url
            })

        return jsonify({
            'success': True,
            'symbol': symbol,
            'news': formatted_news,
            'count': len(formatted_news),
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to fetch news',
            'details': str(e)
        }), 400

# Popular stocks database for search
POPULAR_STOCKS = {
    # Tech Giants
    'AAPL': 'Apple Inc.', 'MSFT': 'Microsoft Corporation', 'GOOGL': 'Alphabet Inc. (Google)',
    'AMZN': 'Amazon.com Inc.', 'META': 'Meta Platforms Inc. (Facebook)', 'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation', 'NFLX': 'Netflix Inc.', 'AMD': 'Advanced Micro Devices',
    'INTC': 'Intel Corporation', 'CRM': 'Salesforce Inc.', 'ORCL': 'Oracle Corporation',
    'ADBE': 'Adobe Inc.', 'PYPL': 'PayPal Holdings Inc.', 'UBER': 'Uber Technologies Inc.',

    # Financial
    'JPM': 'JPMorgan Chase & Co.', 'BAC': 'Bank of America Corp', 'WFC': 'Wells Fargo & Company',
    'GS': 'Goldman Sachs Group Inc.', 'MS': 'Morgan Stanley', 'V': 'Visa Inc.', 'MA': 'Mastercard Inc.',

    # Healthcare
    'JNJ': 'Johnson & Johnson', 'UNH': 'UnitedHealth Group Inc.', 'PFE': 'Pfizer Inc.',
    'ABBV': 'AbbVie Inc.', 'TMO': 'Thermo Fisher Scientific', 'MRK': 'Merck & Co. Inc.',

    # Consumer
    'WMT': 'Walmart Inc.', 'HD': 'Home Depot Inc.', 'DIS': 'Walt Disney Company',
    'NKE': 'Nike Inc.', 'MCD': 'McDonald\'s Corporation', 'SBUX': 'Starbucks Corporation',
    'KO': 'Coca-Cola Company', 'PEP': 'PepsiCo Inc.', 'COST': 'Costco Wholesale Corp',

    # Energy
    'XOM': 'Exxon Mobil Corporation', 'CVX': 'Chevron Corporation', 'COP': 'ConocoPhillips',

    # ETFs
    'SPY': 'SPDR S&P 500 ETF Trust', 'QQQ': 'Invesco QQQ Trust (Nasdaq-100)',
    'VOO': 'Vanguard S&P 500 ETF', 'IWF': 'iShares Russell 1000 Growth ETF',
    'SCHD': 'Schwab U.S. Dividend Equity ETF', 'VTI': 'Vanguard Total Stock Market ETF',
    'DIA': 'SPDR Dow Jones Industrial Average ETF',

    # Gold/Commodities
    'GLD': 'SPDR Gold Trust', 'SLV': 'iShares Silver Trust', 'IAU': 'iShares Gold Trust',

    # Crypto
    'BTC-USD': 'Bitcoin USD', 'ETH-USD': 'Ethereum USD',

    # Other Popular
    'BA': 'Boeing Company', 'CAT': 'Caterpillar Inc.', 'IBM': 'IBM Corporation',
    'T': 'AT&T Inc.', 'VZ': 'Verizon Communications', 'CSCO': 'Cisco Systems Inc.'
}

# Stock search endpoint
@app.route('/api/search', methods=['GET'])
def search_stocks():
    """
    Search for stock symbols by company name

    Parameters:
    - q: Query string (company name or partial ticker)

    Returns:
    - results: List of matching stocks with symbol and name
    """
    try:
        query = request.args.get('q', '').strip()

        if not query or len(query) < 1:
            return jsonify({
                'success': False,
                'error': 'Query parameter "q" is required (min 1 character)'
            }), 400

        query_lower = query.lower()
        results = []

        # Search through popular stocks
        for symbol, name in POPULAR_STOCKS.items():
            # Match if query appears in symbol or company name
            if (query_lower in symbol.lower() or
                query_lower in name.lower()):
                results.append({
                    'symbol': symbol,
                    'name': name,
                    'match_type': 'symbol' if query_lower in symbol.lower() else 'name'
                })

        # Sort: exact symbol matches first, then symbol partial, then name matches
        def sort_key(item):
            if item['symbol'].lower() == query_lower:
                return (0, item['symbol'])
            elif item['symbol'].lower().startswith(query_lower):
                return (1, item['symbol'])
            elif item['match_type'] == 'symbol':
                return (2, item['symbol'])
            else:
                return (3, item['symbol'])

        results.sort(key=sort_key)

        # Limit to top 10 results
        results = results[:10]

        return jsonify({
            'success': True,
            'query': query,
            'count': len(results),
            'results': results,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to search stocks',
            'details': str(e)
        }), 400

# Risk metrics endpoint
@app.route('/api/risk-metrics/<symbol>', methods=['GET'])
def get_risk_metrics(symbol):
    """Calculate risk assessment metrics for a stock"""
    try:
        import pandas as pd
        import numpy as np

        symbol = symbol.upper()
        ticker = yf.Ticker(symbol)
        df = ticker.history(period="1y")

        if df.empty:
            return jsonify({
                'success': False,
                'error': f'No data found for symbol {symbol}'
            }), 404

        # Calculate returns
        returns = df['Close'].pct_change().dropna()

        # Sharpe Ratio (assuming risk-free rate of 2%)
        risk_free_rate = 0.02
        sharpe = (returns.mean() * 252 - risk_free_rate) / (returns.std() * np.sqrt(252))

        # Volatility (annualized)
        volatility = returns.std() * np.sqrt(252)

        # Maximum Drawdown
        cumulative = (1 + returns).cumprod()
        running_max = cumulative.cummax()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min()

        # Beta (vs SPY)
        try:
            spy = yf.Ticker('SPY')
            spy_df = spy.history(period="1y")
            spy_returns = spy_df['Close'].pct_change().dropna()

            # Align dates
            aligned_returns = pd.concat([returns, spy_returns], axis=1, join='inner')
            aligned_returns.columns = ['stock', 'market']

            if len(aligned_returns) > 0:
                covariance = aligned_returns.cov().iloc[0, 1]
                market_variance = aligned_returns['market'].var()
                beta = covariance / market_variance if market_variance != 0 else 1.0
            else:
                beta = 1.0
        except:
            beta = 1.0

        # Value at Risk (95% confidence)
        var_95 = returns.quantile(0.05)

        return jsonify({
            'success': True,
            'symbol': symbol,
            'metrics': {
                'sharpe_ratio': round(sharpe, 2),
                'volatility': round(volatility * 100, 2),  # as percentage
                'max_drawdown': round(max_drawdown * 100, 2),  # as percentage
                'beta': round(beta, 2),
                'var_95': round(var_95 * 100, 2)  # as percentage
            },
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to calculate risk metrics',
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
    print("  GET  /api/news/<symbol>       - Get stock news")
    print("  POST /api/predict/batch       - Batch predictions")
    print("  GET  /api/search?q=<query>    - Search stocks by name")
    print("  GET  /api/assets              - List supported assets")
    print(f"\nServer starting on port {port}")
    print("="*60 + "\n")

    app.run(debug=debug, port=port, host='0.0.0.0')
