"""
Enhanced Stock Prediction Model
Improvements:
1. XGBoost for better performance
2. Feature scaling and normalization
3. Ensemble voting classifier
4. Better hyperparameter tuning
5. Time-series cross-validation
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score, precision_recall_curve
from sklearn.feature_selection import SelectKBest, f_classif
import joblib
import warnings
warnings.filterwarnings('ignore')

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("XGBoost not available. Install with: pip install xgboost")

from feature_engineering import calculate_technical_indicators, prepare_model_data


class EnhancedStockPredictor:
    """Enhanced ensemble model for stock prediction"""

    def __init__(self):
        self.scaler = RobustScaler()  # Robust to outliers
        self.feature_selector = SelectKBest(f_classif, k=25)  # Select best features
        self.models = {}
        self.ensemble = None
        self.feature_names = None

    def create_models(self):
        """Create individual models for ensemble"""

        # 1. Enhanced Random Forest
        self.models['rf'] = RandomForestClassifier(
            n_estimators=500,
            max_depth=12,
            min_samples_split=10,
            min_samples_leaf=4,
            max_features='sqrt',
            class_weight='balanced',
            bootstrap=True,
            oob_score=True,
            random_state=42,
            n_jobs=-1
        )

        # 2. Gradient Boosting with better params
        self.models['gb'] = GradientBoostingClassifier(
            n_estimators=300,
            learning_rate=0.03,
            max_depth=5,
            min_samples_split=15,
            min_samples_leaf=8,
            subsample=0.85,
            max_features='sqrt',
            validation_fraction=0.1,
            n_iter_no_change=10,
            random_state=42
        )

        # 3. XGBoost (if available)
        if XGB_AVAILABLE:
            self.models['xgb'] = xgb.XGBClassifier(
                n_estimators=400,
                max_depth=6,
                learning_rate=0.02,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=3,
                gamma=0.1,
                reg_alpha=0.1,
                reg_lambda=1,
                scale_pos_weight=1,
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            )

        # 4. Neural Network
        self.models['mlp'] = MLPClassifier(
            hidden_layer_sizes=(100, 50, 25),
            activation='relu',
            solver='adam',
            alpha=0.01,
            learning_rate='adaptive',
            learning_rate_init=0.001,
            max_iter=500,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=42
        )

    def add_engineered_features(self, df):
        """Add advanced engineered features"""

        # Market regime detection
        df['Market_Regime'] = pd.cut(df['Volatility'], bins=3, labels=[0, 1, 2])

        # Trend strength
        df['Trend_Strength'] = abs(df['SMA_5_20_Ratio'] - 1)

        # Volume-price divergence
        df['VP_Divergence'] = (df['Volume_Change'] * -df['Daily_Return']).rolling(5).mean()

        # Momentum quality (consistency of momentum)
        df['Momentum_Quality'] = df['Daily_Return'].rolling(10).apply(
            lambda x: np.sum(x > 0) / len(x) if len(x) > 0 else 0.5
        )

        # Support/Resistance levels
        df['Distance_to_High'] = (df['High'].rolling(20).max() - df['Close']) / df['Close']
        df['Distance_to_Low'] = (df['Close'] - df['Low'].rolling(20).min()) / df['Close']

        # Volatility regime change
        df['Volatility_Change'] = df['Volatility'].pct_change()

        # Price efficiency (how directly price moves)
        df['Price_Efficiency'] = df['Close'].diff(10) / df['Close'].diff().abs().rolling(10).sum()

        # Volume profile
        df['Volume_Profile'] = df['Volume'].rolling(5).mean() / df['Volume'].rolling(20).mean()

        # Fear/Greed indicator (simplified)
        df['Fear_Greed'] = (df['RSI'] + df['Stochastic'] + (100 - df['Williams_R'])) / 3

        return df

    def prepare_features(self, X_train, X_test=None):
        """Scale and select features"""

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Select best features
        X_train_selected = self.feature_selector.fit_transform(X_train_scaled, y_train)

        if X_test is not None:
            X_test_scaled = self.scaler.transform(X_test)
            X_test_selected = self.feature_selector.transform(X_test_scaled)
            return X_train_selected, X_test_selected

        return X_train_selected

    def train_ensemble(self, X_train, y_train, use_weights=True):
        """Train ensemble of models"""

        print("Training enhanced ensemble model...")

        # Create models
        self.create_models()

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Feature selection
        X_train_selected = self.feature_selector.fit_transform(X_train_scaled, y_train)

        # Store selected feature indices
        selected_features = self.feature_selector.get_support(indices=True)
        self.feature_names = X_train.columns[selected_features].tolist()

        # Train individual models and get validation scores
        val_scores = {}
        tscv = TimeSeriesSplit(n_splits=3)

        for name, model in self.models.items():
            print(f"Training {name}...")
            scores = []

            for train_idx, val_idx in tscv.split(X_train_selected):
                X_t, X_v = X_train_selected[train_idx], X_train_selected[val_idx]
                y_t, y_v = y_train.iloc[train_idx], y_train.iloc[val_idx]

                if name == 'gb':
                    # Special handling for gradient boosting
                    from sklearn.utils.class_weight import compute_sample_weight
                    sample_weights = compute_sample_weight('balanced', y_t)
                    model.fit(X_t, y_t, sample_weight=sample_weights)
                else:
                    model.fit(X_t, y_t)

                score = model.score(X_v, y_v)
                scores.append(score)

            val_scores[name] = np.mean(scores)
            print(f"{name} validation score: {val_scores[name]:.4f}")

        # Create weighted ensemble based on validation scores
        if use_weights:
            # Normalize scores to get weights
            total_score = sum(val_scores.values())
            weights = [val_scores[name]/total_score for name in self.models.keys()]
            print(f"\nEnsemble weights: {dict(zip(self.models.keys(), weights))}")
        else:
            weights = None

        # Train final models on full training data
        for name, model in self.models.items():
            print(f"Final training {name}...")
            if name == 'gb':
                from sklearn.utils.class_weight import compute_sample_weight
                sample_weights = compute_sample_weight('balanced', y_train)
                model.fit(X_train_selected, y_train, sample_weight=sample_weights)
            else:
                model.fit(X_train_selected, y_train)

        # Create voting classifier
        estimators = [(name, model) for name, model in self.models.items()]
        self.ensemble = VotingClassifier(
            estimators=estimators,
            voting='soft',  # Use probability predictions
            weights=weights
        )

        # Fit ensemble
        self.ensemble.fit(X_train_selected, y_train)

        return self

    def predict(self, X):
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)
        return self.ensemble.predict(X_selected)

    def predict_proba(self, X):
        """Get prediction probabilities"""
        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)
        return self.ensemble.predict_proba(X_selected)

    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""

        # Get predictions
        y_pred = self.predict(X_test)
        y_proba = self.predict_proba(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)

        print("\n" + "="*50)
        print("ENHANCED MODEL PERFORMANCE")
        print("="*50)
        print(f"Test Accuracy: {accuracy:.4f}")

        # Individual model performance
        X_test_scaled = self.scaler.transform(X_test)
        X_test_selected = self.feature_selector.transform(X_test_scaled)

        print("\nIndividual Model Performance:")
        for name, model in self.models.items():
            score = model.score(X_test_selected, y_test)
            print(f"{name}: {score:.4f}")

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Down', 'Up']))

        # Confidence analysis
        confidence = np.max(y_proba, axis=1)
        high_conf_mask = confidence > 0.60
        if high_conf_mask.sum() > 0:
            high_conf_accuracy = accuracy_score(y_test[high_conf_mask], y_pred[high_conf_mask])
            print(f"\nHigh Confidence Predictions (>60%): {high_conf_mask.sum()}/{len(y_test)}")
            print(f"High Confidence Accuracy: {high_conf_accuracy:.4f}")

        print(f"\nTop Features:")
        for i, feat in enumerate(self.feature_names[:10]):
            print(f"  {i+1}. {feat}")

        return accuracy


def train_enhanced_model():
    """Main training function"""

    print("="*60)
    print("TRAINING ENHANCED STOCK PREDICTION MODEL")
    print("="*60)

    # Load and prepare data
    print("\n1. Loading data...")
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)

    # Calculate technical indicators
    print("2. Calculating technical indicators...")
    df = calculate_technical_indicators(df)

    # Add enhanced features
    print("3. Adding engineered features...")
    predictor = EnhancedStockPredictor()
    df = predictor.add_engineered_features(df)

    # Add new features to feature list
    enhanced_features = [
        'Market_Regime', 'Trend_Strength', 'VP_Divergence',
        'Momentum_Quality', 'Distance_to_High', 'Distance_to_Low',
        'Volatility_Change', 'Price_Efficiency', 'Volume_Profile', 'Fear_Greed'
    ]

    # Prepare model data
    print("4. Preparing model data...")
    X, y, df_clean = prepare_model_data(df)

    # Add enhanced features to X
    for feat in enhanced_features:
        if feat in df_clean.columns:
            X[feat] = df_clean[feat]

    # Remove any remaining NaNs
    mask = ~(X.isna().any(axis=1) | y.isna())
    X = X[mask]
    y = y[mask]

    print(f"   Total samples: {len(X)}")
    print(f"   Features: {X.shape[1]}")
    print(f"   Class distribution: UP={y.sum()}, DOWN={len(y)-y.sum()}")

    # Time series split (don't shuffle!)
    split_point = int(len(X) * 0.8)
    X_train = X.iloc[:split_point]
    X_test = X.iloc[split_point:]
    y_train = y.iloc[:split_point]
    y_test = y.iloc[split_point:]

    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples: {len(X_test)}")

    # Train enhanced model
    print("\n5. Training enhanced ensemble model...")
    predictor.train_ensemble(X_train, y_train)

    # Evaluate
    print("\n6. Evaluating model...")
    accuracy = predictor.evaluate(X_test, y_test)

    # Save model
    print("\n7. Saving enhanced model...")
    model_data = {
        'ensemble': predictor.ensemble,
        'scaler': predictor.scaler,
        'feature_selector': predictor.feature_selector,
        'feature_names': predictor.feature_names,
        'accuracy': accuracy
    }
    joblib.dump(model_data, 'models/enhanced_spy_model.pkl')
    print("   Model saved as 'models/enhanced_spy_model.pkl'")

    # Compare with original model
    try:
        original_model = joblib.load('models/spy_model.pkl')
        X_test_original = X_test[X.columns[:30]]  # Use only original features
        original_accuracy = accuracy_score(y_test, original_model.predict(X_test_original))

        print(f"\n" + "="*50)
        print("MODEL COMPARISON")
        print("="*50)
        print(f"Original Model Accuracy: {original_accuracy:.4f}")
        print(f"Enhanced Model Accuracy: {accuracy:.4f}")
        print(f"Improvement: {(accuracy - original_accuracy)*100:.2f}%")

    except Exception as e:
        print(f"\nCouldn't compare with original model: {e}")

    return predictor


if __name__ == "__main__":
    # First install xgboost if not available
    if not XGB_AVAILABLE:
        print("Installing XGBoost...")
        import subprocess
        subprocess.check_call(["py", "-m", "pip", "install", "xgboost"])
        print("XGBoost installed! Please restart the script.")
    else:
        train_enhanced_model()