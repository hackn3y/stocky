import yfinance as yf

# Test gold-related tickers
tickers = ['GLD', 'IAU', 'GC=F', 'GOLD']

for t in tickers:
    try:
        ticker = yf.Ticker(t)
        info = ticker.info
        hist = ticker.history(period='5d')
        name = info.get('shortName', info.get('longName', 'N/A'))
        print(f'\n{t}: {name}')
        print(f'  Has data: {len(hist) > 0}')
        if len(hist) > 0:
            print(f'  Latest price: ${hist["Close"].iloc[-1]:.2f}')
    except Exception as e:
        print(f'\n{t}: ERROR - {str(e)[:100]}')
