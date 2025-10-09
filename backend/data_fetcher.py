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
