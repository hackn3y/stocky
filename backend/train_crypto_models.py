"""
Train cryptocurrency-specific ML models for BTC-USD and XRP-USD

Cryptocurrencies have different characteristics than stocks:
- 24/7 trading (no market hours)
- Higher volatility
- Different market drivers
- More speculative behavior

This script trains separate models optimized for crypto prediction.
"""

import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
from feature_engineering import calculate_technical_indicators, prepare_model_data

def download_crypto_data(symbol, period='5y'):
    """Download cryptocurrency data from Yahoo Finance"""
    print(f"\nDownloading {symbol} data...")

    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(period=period)

        if df.empty:
            raise ValueError(f"No data downloaded for {symbol}")

        print(f"Downloaded {len(df)} days of {symbol} data")
        print(f"Date range: {df.index[0]} to {df.index[-1]}")

        # Save to CSV
        df.to_csv(f'{symbol.lower().replace("-", "_")}_data.csv')
        print(f"Saved to {symbol.lower().replace('-', '_')}_data.csv")

        return df

    except Exception as e:
        print(f"Error downloading {symbol}: {e}")
        return None

def train_crypto_model(X_train, y_train, symbol):
    """
    Train a crypto-specific model with optimized hyperparameters

    Crypto-specific optimizations:
    - More trees to handle higher volatility
    - Deeper trees to capture complex patterns
    - Balanced class weights for volatile price action
    """

    print(f"\n{'='*60}")
    print(f"Training {symbol} Crypto Model")
    print(f"{'='*60}")

    # Random Forest - optimized for crypto volatility
    rf_model = RandomForestClassifier(
        n_estimators=500,            # More trees for volatile data
        max_depth=None,              # Allow full depth for crypto complexity
        min_samples_split=3,         # More aggressive splitting
        min_samples_leaf=1,          # Allow small leaf nodes
        max_features='sqrt',         # Standard feature selection
        class_weight='balanced',     # Handle imbalanced classes
        bootstrap=True,
        random_state=42,
        n_jobs=-1
    )

    print("Training Random Forest...")
    rf_model.fit(X_train, y_train)

    # Gradient Boosting - alternative approach
    from sklearn.utils.class_weight import compute_sample_weight
    sample_weights = compute_sample_weight('balanced', y_train)

    gb_model = GradientBoostingClassifier(
        n_estimators=300,            # More boosting stages
        learning_rate=0.03,          # Lower learning rate for crypto
        max_depth=5,                 # Deeper trees for crypto patterns
        min_samples_split=15,
        min_samples_leaf=7,
        subsample=0.8,
        max_features='sqrt',
        random_state=42
    )

    print("Training Gradient Boosting...")
    gb_model.fit(X_train, y_train, sample_weight=sample_weights)

    return rf_model, gb_model

def evaluate_crypto_model(model, X_test, y_test, model_name, symbol):
    """Evaluate crypto model performance"""

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"\n=== {model_name} Performance for {symbol} ===")
    print(f"Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Down', 'Up'], zero_division=0))

    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    print(f"True Negatives: {cm[0][0]}, False Positives: {cm[0][1]}")
    print(f"False Negatives: {cm[1][0]}, True Positives: {cm[1][1]}")

    return accuracy

def train_and_save_crypto_model(symbol):
    """Complete pipeline to train and save a crypto model"""

    print(f"\n{'#'*70}")
    print(f"# TRAINING MODEL FOR {symbol}")
    print(f"{'#'*70}")

    # Download data
    df = download_crypto_data(symbol, period='5y')

    if df is None or df.empty:
        print(f"Failed to download data for {symbol}")
        return None

    # Calculate technical indicators
    print(f"\nCalculating technical indicators for {symbol}...")
    df = calculate_technical_indicators(df)

    # Prepare model data
    print(f"Preparing model data for {symbol}...")
    X, y, df_clean = prepare_model_data(df)

    if X is None or len(X) == 0:
        print(f"Failed to prepare data for {symbol}")
        return None

    print(f"Total samples: {len(X)}")
    print(f"Features: {len(X.columns)}")
    print(f"Up days: {sum(y == 1)}, Down days: {sum(y == 0)}")

    # Split data (80% train, 20% test) - no shuffle for time series
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    # Train both model types
    rf_model, gb_model = train_crypto_model(X_train, y_train, symbol)

    # Evaluate both models
    print(f"\n{'='*60}")
    print(f"MODEL COMPARISON FOR {symbol}")
    print(f"{'='*60}")

    rf_accuracy = evaluate_crypto_model(rf_model, X_test, y_test, "Random Forest", symbol)
    gb_accuracy = evaluate_crypto_model(gb_model, X_test, y_test, "Gradient Boosting", symbol)

    # Choose best model
    if gb_accuracy > rf_accuracy:
        print(f"\n[SUCCESS] Gradient Boosting performs better ({gb_accuracy:.4f} vs {rf_accuracy:.4f})")
        best_model = gb_model
        model_name = "Gradient Boosting"
    else:
        print(f"\n[SUCCESS] Random Forest performs better ({rf_accuracy:.4f} vs {gb_accuracy:.4f})")
        best_model = rf_model
        model_name = "Random Forest"

    # Feature importance
    print(f"\n=== Top 10 Features for {symbol} ===")
    importance_df = pd.DataFrame({
        'Feature': X.columns,
        'Importance': best_model.feature_importances_
    }).sort_values('Importance', ascending=False)

    print(importance_df.head(10).to_string(index=False))

    # Cross-validation
    print(f"\n=== Cross-Validation for {symbol} ===")
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=5, scoring='accuracy')
    print(f"CV Scores: {[f'{score:.4f}' for score in cv_scores]}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Save model
    model_filename = f'models/{symbol.lower().replace("-", "_")}_model.pkl'
    os.makedirs('models', exist_ok=True)
    joblib.dump(best_model, model_filename)

    print(f"\n[SUCCESS] {model_name} model saved as '{model_filename}'")
    print(f"[SUCCESS] Final test accuracy: {gb_accuracy if gb_accuracy > rf_accuracy else rf_accuracy:.4f}")

    return {
        'symbol': symbol,
        'model': best_model,
        'model_type': model_name,
        'accuracy': gb_accuracy if gb_accuracy > rf_accuracy else rf_accuracy,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std()
    }

if __name__ == "__main__":
    print("="*70)
    print(" CRYPTOCURRENCY MODEL TRAINING")
    print(" Training separate models for BTC-USD and XRP-USD")
    print("="*70)

    # Train BTC-USD model
    btc_result = train_and_save_crypto_model('BTC-USD')

    # Train XRP-USD model
    xrp_result = train_and_save_crypto_model('XRP-USD')

    # Summary
    print("\n" + "="*70)
    print(" TRAINING SUMMARY")
    print("="*70)

    if btc_result:
        print(f"\n[SUCCESS] BTC-USD Model:")
        print(f"  Type: {btc_result['model_type']}")
        print(f"  Test Accuracy: {btc_result['accuracy']:.4f} ({btc_result['accuracy']*100:.2f}%)")
        print(f"  CV Accuracy: {btc_result['cv_mean']:.4f} (+/- {btc_result['cv_std']*2:.4f})")

    if xrp_result:
        print(f"\n[SUCCESS] XRP-USD Model:")
        print(f"  Type: {xrp_result['model_type']}")
        print(f"  Test Accuracy: {xrp_result['accuracy']:.4f} ({xrp_result['accuracy']*100:.2f}%)")
        print(f"  CV Accuracy: {xrp_result['cv_mean']:.4f} (+/- {xrp_result['cv_std']*2:.4f})")

    print("\n" + "="*70)
    print(" CRYPTO MODELS TRAINING COMPLETE")
    print("="*70)
