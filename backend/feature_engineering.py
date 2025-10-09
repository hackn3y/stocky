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

    # NEW FEATURES FOR BETTER PERFORMANCE

    # Volatility (standard deviation of returns)
    df['Volatility'] = df['Daily_Return'].rolling(window=20).std()

    # Price position within Bollinger Bands (normalized)
    df['BB_Position'] = (df['Close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])

    # Moving average crossovers (trend indicators)
    df['SMA_5_20_Ratio'] = df['SMA_5'] / df['SMA_20']
    df['SMA_20_50_Ratio'] = df['SMA_20'] / df['SMA_50']

    # Price distance from moving averages (normalized)
    df['Price_to_SMA5'] = (df['Close'] - df['SMA_5']) / df['SMA_5']
    df['Price_to_SMA20'] = (df['Close'] - df['SMA_20']) / df['SMA_20']

    # MACD Histogram
    df['MACD_Hist'] = df['MACD'] - df['MACD_Signal']

    # Momentum as percentage
    df['Momentum_Pct'] = df['Close'].pct_change(periods=10)

    # High-Low range
    df['HL_Ratio'] = (df['High'] - df['Low']) / df['Close']

    # Multiple time period returns
    df['Return_2d'] = df['Close'].pct_change(periods=2)
    df['Return_5d'] = df['Close'].pct_change(periods=5)

    # Volume change
    df['Volume_Change'] = df['Volume'].pct_change()

    # Price acceleration (rate of change of momentum)
    df['Price_Acceleration'] = df['Daily_Return'].diff()

    # ADVANCED FEATURES FOR BETTER ACCURACY

    # Stochastic Oscillator (momentum indicator)
    low_14 = df['Low'].rolling(window=14).min()
    high_14 = df['High'].rolling(window=14).max()
    df['Stochastic'] = 100 * (df['Close'] - low_14) / (high_14 - low_14)

    # Average True Range (volatility measure)
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())
    tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
    df['ATR'] = tr.rolling(window=14).mean()
    df['ATR_Pct'] = df['ATR'] / df['Close']  # Normalized

    # Money Flow Index (volume-weighted RSI)
    typical_price = (df['High'] + df['Low'] + df['Close']) / 3
    money_flow = typical_price * df['Volume']
    positive_flow = money_flow.where(typical_price > typical_price.shift(1), 0).rolling(14).sum()
    negative_flow = money_flow.where(typical_price < typical_price.shift(1), 0).rolling(14).sum()
    mfi_ratio = positive_flow / negative_flow
    df['MFI'] = 100 - (100 / (1 + mfi_ratio))

    # On-Balance Volume (cumulative volume indicator)
    obv = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
    df['OBV_EMA'] = obv.ewm(span=20).mean()
    df['OBV_Ratio'] = obv / obv.rolling(window=20).mean()

    # Williams %R (momentum indicator)
    df['Williams_R'] = -100 * (high_14 - df['Close']) / (high_14 - low_14)

    # Commodity Channel Index (CCI)
    typical_price = (df['High'] + df['Low'] + df['Close']) / 3
    sma_tp = typical_price.rolling(window=20).mean()
    mad = typical_price.rolling(window=20).apply(lambda x: np.abs(x - x.mean()).mean())
    df['CCI'] = (typical_price - sma_tp) / (0.015 * mad)

    # Price Rate of Change
    df['ROC'] = df['Close'].pct_change(periods=12) * 100

    # Trend strength (ADX-like indicator)
    plus_dm = df['High'].diff()
    minus_dm = df['Low'].diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0)
    minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0)
    tr_14 = tr.rolling(window=14).sum()
    plus_di = 100 * (plus_dm.rolling(14).sum() / tr_14)
    minus_di = 100 * (minus_dm.rolling(14).sum() / tr_14)
    df['DI_Diff'] = plus_di - minus_di

    # Consecutive up/down days (pattern detection)
    df['Consecutive_Up'] = (df['Close'] > df['Close'].shift(1)).astype(int)
    df['Consecutive_Down'] = (df['Close'] < df['Close'].shift(1)).astype(int)
    df['Up_Streak'] = df['Consecutive_Up'].rolling(5).sum()
    df['Down_Streak'] = df['Consecutive_Down'].rolling(5).sum()

    # Gap analysis
    df['Gap'] = (df['Open'] - df['Close'].shift(1)) / df['Close'].shift(1)

    # Intraday range
    df['Intraday_Range'] = (df['High'] - df['Low']) / df['Open']

    # Close position within daily range
    df['Close_Position'] = (df['Close'] - df['Low']) / (df['High'] - df['Low'])

    # Volume momentum
    df['Volume_Momentum'] = df['Volume'].pct_change(periods=5)

    # Target: Next day direction (1 = up, 0 = down)
    df['Target'] = (df['Close'].shift(-1) > df['Close']).astype(int)

    return df

def prepare_model_data(df):
    """Prepare data for model training"""

    # Comprehensive feature set - normalized and scaled features
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
