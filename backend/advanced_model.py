"""
Ultra-Advanced Stock Prediction Model
Improvements over enhanced model:
1. LSTM for temporal pattern learning
2. LightGBM and CatBoost models
3. Advanced market microstructure features
4. Stacking ensemble with meta-learner
5. Confidence calibration
6. Market regime-specific models
7. Feature interactions
8. Hyperparameter optimization with Optuna
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, RobustScaler, PolynomialFeatures
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score, log_loss
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import StackingClassifier
import joblib
import warnings
warnings.filterwarnings('ignore')

# Import advanced libraries
try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False
    print("LightGBM not available")

try:
    import catboost as cb
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False
    print("CatBoost not available")

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("XGBoost not available")

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, regularizers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("TensorFlow not available")

try:
    import optuna
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False
    print("Optuna not available")

from feature_engineering import calculate_technical_indicators, prepare_model_data


class UltraAdvancedPredictor:
    """Ultra-advanced ensemble model with deep learning and stacking"""

    def __init__(self):
        self.scaler = RobustScaler()
        self.feature_selector = SelectKBest(mutual_info_classif, k=30)
        self.base_models = {}
        self.stacking_ensemble = None
        self.lstm_model = None
        self.feature_names = None
        self.calibrated_models = {}
        self.market_regime_models = {}

    def add_market_microstructure_features(self, df):
        """Add advanced market microstructure features"""

        # Amihud Illiquidity Ratio
        df['Illiquidity'] = abs(df['Daily_Return']) / (df['Volume'] + 1)
        df['Illiquidity_MA'] = df['Illiquidity'].rolling(20).mean()

        # Roll's Spread Estimator
        df['Price_Change'] = df['Close'].diff()
        df['Roll_Spread'] = 2 * np.sqrt(-df['Price_Change'].rolling(20).apply(
            lambda x: np.cov(x[:-1], x[1:])[0, 1] if len(x) > 1 else 0
        ))

        # Kyle's Lambda (price impact)
        df['Kyle_Lambda'] = df['Price_Change'].abs() / (df['Volume'].rolling(5).mean() + 1)

        # Corwin-Schultz Spread
        df['High_Low_Ratio'] = np.log(df['High'] / df['Low'])
        df['CS_Spread'] = 2 * (np.exp(df['High_Low_Ratio'].rolling(2).mean()) - 1) / (
            1 + np.exp(df['High_Low_Ratio'].rolling(2).mean())
        )

        # Volume-synchronized probability of informed trading (VPIN)
        df['Buy_Volume'] = df['Volume'] * (df['Close'] > df['Open']).astype(int)
        df['Sell_Volume'] = df['Volume'] * (df['Close'] <= df['Open']).astype(int)
        df['Order_Imbalance'] = (df['Buy_Volume'] - df['Sell_Volume']) / (df['Volume'] + 1)
        df['VPIN'] = abs(df['Order_Imbalance'].rolling(50).mean())

        # Realized Volatility at different frequencies
        df['RV_5min'] = df['High_Low_Ratio'].rolling(5).std()
        df['RV_30min'] = df['High_Low_Ratio'].rolling(30).std()
        df['RV_Ratio'] = df['RV_5min'] / (df['RV_30min'] + 0.001)

        # Microstructure noise
        df['Noise'] = (df['High'] - df['Low']) / (df['Close'].rolling(20).std() + 0.001)

        # Jump detection (large price movements)
        df['Price_Jump'] = (abs(df['Daily_Return']) > df['Daily_Return'].rolling(252).std() * 3).astype(int)
        df['Jump_Intensity'] = df['Price_Jump'].rolling(20).sum()

        # Hurst Exponent (trend persistence)
        def hurst_exponent(ts):
            lags = range(2, min(20, len(ts) // 2))
            tau = [np.sqrt(np.std(np.subtract(ts[lag:], ts[:-lag]))) for lag in lags]
            poly = np.polyfit(np.log(lags), np.log(tau), 1)
            return poly[0] * 2.0

        df['Hurst'] = df['Close'].rolling(50).apply(hurst_exponent)

        # Information share (Hasbrouck)
        df['Info_Share'] = df['Volume'] * abs(df['Daily_Return']) / df['Volume'].rolling(20).sum()

        return df

    def add_intermarket_features(self, df):
        """Add features from related markets (would need external data in practice)"""

        # Simulated correlation features (in practice, load actual data)
        # VIX proxy (volatility index)
        df['VIX_Proxy'] = df['Volatility'].rolling(20).mean() * 100

        # Dollar strength proxy
        df['Dollar_Strength'] = 100 - df['Close'].pct_change(20) * 100

        # Bond-Stock correlation proxy
        df['Bond_Stock_Corr'] = df['Daily_Return'].rolling(60).apply(
            lambda x: np.corrcoef(x, np.arange(len(x)))[0, 1] if len(x) > 1 else 0
        )

        # Sector rotation indicator
        df['Sector_Rotation'] = df['Volume_Change'].rolling(20).mean() * df['Momentum_Pct']

        return df

    def create_feature_interactions(self, X):
        """Create polynomial and interaction features"""

        # Check if DataFrame is empty
        if X.empty or len(X) == 0:
            return X

        # Select most important features for interactions (to avoid explosion)
        important_features = ['RSI', 'BB_Position', 'Momentum_Pct', 'Volume_Ratio', 'Volatility']

        # Check which features are actually available
        available_features = [f for f in important_features if f in X.columns]

        if len(available_features) < 2:
            print("Not enough features for interactions")
            return X

        interaction_data = X[available_features].values

        # Check if we have valid data
        if interaction_data.shape[0] == 0:
            return X

        # Create 2-degree polynomial features
        poly = PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)
        poly_features = poly.fit_transform(interaction_data)

        # Get feature names
        poly_names = poly.get_feature_names_out(available_features)

        # Create DataFrame with polynomial features (only the interaction terms)
        if poly_features.shape[1] > len(available_features):
            poly_df = pd.DataFrame(poly_features[:, len(available_features):],
                                   columns=poly_names[len(available_features):],
                                   index=X.index)

            # Concatenate with original features
            X_with_interactions = pd.concat([X, poly_df], axis=1)
        else:
            X_with_interactions = X

        return X_with_interactions

    def create_lstm_sequences(self, X, y, sequence_length=20):
        """Create sequences for LSTM training"""

        sequences = []
        targets = []

        for i in range(sequence_length, len(X)):
            sequences.append(X[i-sequence_length:i])
            targets.append(y[i])

        return np.array(sequences), np.array(targets)

    def build_lstm_model(self, input_shape):
        """Build LSTM model for sequential pattern learning"""

        if not TF_AVAILABLE:
            return None

        model = keras.Sequential([
            # First LSTM layer with dropout
            layers.LSTM(128, return_sequences=True, input_shape=input_shape,
                       kernel_regularizer=regularizers.l2(0.01)),
            layers.Dropout(0.3),
            layers.BatchNormalization(),

            # Second LSTM layer
            layers.LSTM(64, return_sequences=True,
                       kernel_regularizer=regularizers.l2(0.01)),
            layers.Dropout(0.3),
            layers.BatchNormalization(),

            # Third LSTM layer
            layers.LSTM(32, kernel_regularizer=regularizers.l2(0.01)),
            layers.Dropout(0.3),
            layers.BatchNormalization(),

            # Dense layers
            layers.Dense(64, activation='relu',
                        kernel_regularizer=regularizers.l2(0.01)),
            layers.Dropout(0.2),

            layers.Dense(32, activation='relu'),
            layers.Dropout(0.2),

            # Output layer
            layers.Dense(1, activation='sigmoid')
        ])

        # Custom learning rate schedule
        initial_learning_rate = 0.001
        lr_schedule = keras.optimizers.schedules.ExponentialDecay(
            initial_learning_rate,
            decay_steps=100,
            decay_rate=0.96,
            staircase=True
        )

        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=lr_schedule),
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.AUC()]
        )

        return model

    def create_base_models(self):
        """Create diverse base models for stacking"""

        # 1. LightGBM - Fast and accurate
        if LGB_AVAILABLE:
            self.base_models['lgb'] = lgb.LGBMClassifier(
                n_estimators=500,
                max_depth=7,
                learning_rate=0.02,
                num_leaves=31,
                min_child_samples=20,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=0.1,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )

        # 2. CatBoost - Handles categorical features well
        if CATBOOST_AVAILABLE:
            self.base_models['catboost'] = cb.CatBoostClassifier(
                iterations=500,
                depth=6,
                learning_rate=0.03,
                l2_leaf_reg=3,
                random_seed=42,
                verbose=False,
                thread_count=-1
            )

        # 3. XGBoost with different parameters
        if XGB_AVAILABLE:
            self.base_models['xgb'] = xgb.XGBClassifier(
                n_estimators=500,
                max_depth=5,
                learning_rate=0.02,
                subsample=0.75,
                colsample_bytree=0.75,
                min_child_weight=5,
                gamma=0.2,
                reg_alpha=0.2,
                reg_lambda=1.5,
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            )

        # 4. Extra Trees - Different splitting strategy
        self.base_models['extra_trees'] = ExtraTreesClassifier(
            n_estimators=500,
            max_depth=12,
            min_samples_split=10,
            min_samples_leaf=4,
            max_features='sqrt',
            bootstrap=False,
            random_state=42,
            n_jobs=-1
        )

        # 5. Random Forest with different parameters
        self.base_models['rf'] = RandomForestClassifier(
            n_estimators=600,
            max_depth=10,
            min_samples_split=15,
            min_samples_leaf=5,
            max_features='log2',
            class_weight='balanced_subsample',
            random_state=42,
            n_jobs=-1
        )

        # 6. Deep Neural Network
        self.base_models['mlp'] = MLPClassifier(
            hidden_layer_sizes=(200, 100, 50, 25),
            activation='relu',
            solver='adam',
            alpha=0.01,
            learning_rate='adaptive',
            learning_rate_init=0.001,
            max_iter=1000,
            early_stopping=True,
            validation_fraction=0.15,
            random_state=42
        )

    def optimize_hyperparameters(self, X_train, y_train):
        """Use Optuna for hyperparameter optimization"""

        if not OPTUNA_AVAILABLE:
            print("Optuna not available, using default parameters")
            return

        def objective(trial):
            # Optimize LightGBM parameters
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
                'max_depth': trial.suggest_int('max_depth', 3, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'num_leaves': trial.suggest_int('num_leaves', 20, 300),
                'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
                'subsample': trial.suggest_float('subsample', 0.4, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.4, 1.0),
            }

            model = lgb.LGBMClassifier(**params, random_state=42, verbose=-1)

            # Time series cross-validation
            tscv = TimeSeriesSplit(n_splits=3)
            scores = cross_val_score(model, X_train, y_train, cv=tscv, scoring='roc_auc')

            return scores.mean()

        # Run optimization
        print("Optimizing hyperparameters with Optuna...")
        study = optuna.create_study(direction='maximize', sampler=optuna.samplers.TPESampler(seed=42))
        study.optimize(objective, n_trials=20, show_progress_bar=True)

        # Update LightGBM with best parameters
        if LGB_AVAILABLE:
            best_params = study.best_params
            self.base_models['lgb'] = lgb.LGBMClassifier(
                **best_params,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )
            print(f"Best parameters: {best_params}")
            print(f"Best ROC-AUC: {study.best_value:.4f}")

    def train_market_regime_models(self, X_train, y_train):
        """Train separate models for different market regimes"""

        # Identify market regimes using volatility clustering
        volatility = X_train['Volatility'] if 'Volatility' in X_train.columns else X_train.iloc[:, 0]

        # Define regimes
        vol_percentiles = volatility.quantile([0.33, 0.67])
        low_vol_mask = volatility <= vol_percentiles.iloc[0]
        mid_vol_mask = (volatility > vol_percentiles.iloc[0]) & (volatility <= vol_percentiles.iloc[1])
        high_vol_mask = volatility > vol_percentiles.iloc[1]

        # Train models for each regime
        print("Training market regime-specific models...")

        if low_vol_mask.sum() > 50:
            self.market_regime_models['low_vol'] = RandomForestClassifier(
                n_estimators=200, max_depth=8, random_state=42
            ).fit(X_train[low_vol_mask], y_train[low_vol_mask])

        if mid_vol_mask.sum() > 50:
            self.market_regime_models['mid_vol'] = RandomForestClassifier(
                n_estimators=200, max_depth=8, random_state=42
            ).fit(X_train[mid_vol_mask], y_train[mid_vol_mask])

        if high_vol_mask.sum() > 50:
            self.market_regime_models['high_vol'] = RandomForestClassifier(
                n_estimators=200, max_depth=8, random_state=42
            ).fit(X_train[high_vol_mask], y_train[high_vol_mask])

    def train_advanced_ensemble(self, X_train, y_train):
        """Train the advanced stacking ensemble"""

        print("Training ultra-advanced ensemble model...")

        # Create base models
        self.create_base_models()

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Feature selection
        X_train_selected = self.feature_selector.fit_transform(X_train_scaled, y_train)

        # Store selected feature indices
        selected_features = self.feature_selector.get_support(indices=True)
        self.feature_names = X_train.columns[selected_features].tolist()

        # Optimize hyperparameters for LightGBM
        if OPTUNA_AVAILABLE and LGB_AVAILABLE:
            self.optimize_hyperparameters(X_train_selected, y_train)

        # Train and evaluate individual models
        print("\nTraining base models...")
        tscv = TimeSeriesSplit(n_splits=3)

        for name, model in self.base_models.items():
            scores = []
            for train_idx, val_idx in tscv.split(X_train_selected):
                X_t, X_v = X_train_selected[train_idx], X_train_selected[val_idx]
                y_t, y_v = y_train.iloc[train_idx], y_train.iloc[val_idx]

                # Special handling for CatBoost
                if name == 'catboost':
                    model.fit(X_t, y_t, eval_set=(X_v, y_v), verbose=False)
                else:
                    model.fit(X_t, y_t)

                score = roc_auc_score(y_v, model.predict_proba(X_v)[:, 1])
                scores.append(score)

            avg_score = np.mean(scores)
            print(f"{name}: ROC-AUC = {avg_score:.4f}")

        # Train LSTM if TensorFlow is available
        if TF_AVAILABLE:
            print("\nTraining LSTM model...")
            # Prepare sequences
            X_sequences, y_sequences = self.create_lstm_sequences(X_train_selected, y_train.values, sequence_length=20)

            if len(X_sequences) > 0:
                # Build and train LSTM
                self.lstm_model = self.build_lstm_model((20, X_train_selected.shape[1]))

                # Split sequences for training
                split_point = int(len(X_sequences) * 0.8)
                X_lstm_train = X_sequences[:split_point]
                y_lstm_train = y_sequences[:split_point]
                X_lstm_val = X_sequences[split_point:]
                y_lstm_val = y_sequences[split_point:]

                # Train with early stopping
                early_stopping = keras.callbacks.EarlyStopping(
                    monitor='val_loss',
                    patience=10,
                    restore_best_weights=True
                )

                self.lstm_model.fit(
                    X_lstm_train, y_lstm_train,
                    validation_data=(X_lstm_val, y_lstm_val),
                    epochs=50,
                    batch_size=32,
                    callbacks=[early_stopping],
                    verbose=0
                )

                # Evaluate LSTM
                lstm_score = self.lstm_model.evaluate(X_lstm_val, y_lstm_val, verbose=0)[1]
                print(f"LSTM: Accuracy = {lstm_score:.4f}")

        # Create Stacking Ensemble with calibrated models
        print("\nCreating stacking ensemble...")

        # Calibrate models for better probability estimates
        calibrated_estimators = []
        for name, model in self.base_models.items():
            print(f"Calibrating {name}...")
            # Fit the base model on full training data
            if name == 'catboost':
                model.fit(X_train_selected, y_train, verbose=False)
            else:
                model.fit(X_train_selected, y_train)

            # Calibrate the model
            calibrated = CalibratedClassifierCV(model, method='sigmoid', cv=3)
            calibrated.fit(X_train_selected, y_train)
            self.calibrated_models[name] = calibrated
            calibrated_estimators.append((name + '_cal', calibrated))

        # Create meta-learner
        meta_learner = LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        )

        # Create stacking classifier
        self.stacking_ensemble = StackingClassifier(
            estimators=calibrated_estimators,
            final_estimator=meta_learner,
            cv=3,  # Use cross-validation to train meta-learner
            stack_method='predict_proba',
            n_jobs=-1
        )

        # Train stacking ensemble
        print("Training stacking ensemble...")
        self.stacking_ensemble.fit(X_train_selected, y_train)

        # Train market regime models
        self.train_market_regime_models(X_train_selected, y_train)

        return self

    def predict_with_regime(self, X):
        """Make predictions considering market regime"""

        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)

        # Get base prediction from stacking ensemble
        base_pred = self.stacking_ensemble.predict_proba(X_selected)

        # Adjust based on market regime if available
        if self.market_regime_models and 'Volatility' in X.columns:
            volatility = X['Volatility'].values
            vol_percentiles = [0.33, 0.67]  # Should be stored from training

            predictions = []
            for i, vol in enumerate(volatility):
                if vol <= vol_percentiles[0] and 'low_vol' in self.market_regime_models:
                    regime_pred = self.market_regime_models['low_vol'].predict_proba(X_selected[i:i+1])
                elif vol > vol_percentiles[1] and 'high_vol' in self.market_regime_models:
                    regime_pred = self.market_regime_models['high_vol'].predict_proba(X_selected[i:i+1])
                else:
                    regime_pred = base_pred[i:i+1]

                # Weighted average of base and regime predictions
                final_pred = 0.7 * base_pred[i] + 0.3 * regime_pred[0]
                predictions.append(final_pred)

            return np.array(predictions)

        return base_pred

    def predict(self, X):
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)
        return self.stacking_ensemble.predict(X_selected)

    def predict_proba(self, X):
        """Get prediction probabilities with regime adjustment"""
        return self.predict_with_regime(X)

    def evaluate(self, X_test, y_test):
        """Comprehensive evaluation of the model"""

        # Get predictions
        y_pred = self.predict(X_test)
        y_proba = self.predict_proba(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_proba[:, 1])
        log_loss_score = log_loss(y_test, y_proba)

        print("\n" + "="*50)
        print("ULTRA-ADVANCED MODEL PERFORMANCE")
        print("="*50)
        print(f"Test Accuracy: {accuracy:.4f}")
        print(f"ROC-AUC Score: {roc_auc:.4f}")
        print(f"Log Loss: {log_loss_score:.4f}")

        # Individual model performance
        X_test_scaled = self.scaler.transform(X_test)
        X_test_selected = self.feature_selector.transform(X_test_scaled)

        print("\nIndividual Model Performance:")
        for name, model in self.calibrated_models.items():
            y_pred_ind = model.predict(X_test_selected)
            score = accuracy_score(y_test, y_pred_ind)
            print(f"{name}: {score:.4f}")

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Down', 'Up']))

        # Confidence analysis
        confidence = np.max(y_proba, axis=1)
        for threshold in [0.6, 0.7, 0.8]:
            high_conf_mask = confidence > threshold
            if high_conf_mask.sum() > 0:
                high_conf_accuracy = accuracy_score(y_test[high_conf_mask], y_pred[high_conf_mask])
                print(f"\nConfidence > {threshold}: {high_conf_mask.sum()}/{len(y_test)} predictions")
                print(f"Accuracy at this confidence: {high_conf_accuracy:.4f}")

        print(f"\nTop Features:")
        for i, feat in enumerate(self.feature_names[:15]):
            print(f"  {i+1}. {feat}")

        return accuracy, roc_auc


def train_ultra_advanced_model():
    """Main training function for ultra-advanced model"""

    print("="*60)
    print("TRAINING ULTRA-ADVANCED STOCK PREDICTION MODEL")
    print("="*60)

    # Load and prepare data
    print("\n1. Loading data...")
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)

    # Calculate technical indicators
    print("2. Calculating technical indicators...")
    df = calculate_technical_indicators(df)

    # Initialize predictor
    predictor = UltraAdvancedPredictor()

    # Add market microstructure features
    print("3. Adding market microstructure features...")
    df = predictor.add_market_microstructure_features(df)

    # Add intermarket features
    print("4. Adding intermarket features...")
    df = predictor.add_intermarket_features(df)

    # Prepare model data
    print("5. Preparing model data...")
    X, y, df_clean = prepare_model_data(df)

    # Create a copy to avoid SettingWithCopyWarning
    X = X.copy()

    # Add all new features to X
    new_features = [
        'Illiquidity', 'Illiquidity_MA', 'Roll_Spread', 'Kyle_Lambda',
        'CS_Spread', 'Order_Imbalance', 'VPIN', 'RV_5min', 'RV_30min',
        'RV_Ratio', 'Noise', 'Price_Jump', 'Jump_Intensity', 'Hurst',
        'Info_Share', 'VIX_Proxy', 'Dollar_Strength', 'Bond_Stock_Corr',
        'Sector_Rotation'
    ]

    # Align df_clean with X index before adding features
    df_clean = df_clean.loc[X.index]

    for feat in new_features:
        if feat in df_clean.columns:
            X[feat] = df_clean[feat].values

    # Add feature interactions
    print("6. Creating feature interactions...")
    X = predictor.create_feature_interactions(X)

    # Replace infinite values with large finite values first
    X = X.replace([np.inf, -np.inf], [1e10, -1e10])

    # Fill NaNs with forward fill then backward fill for new features
    X = X.ffill().bfill()

    # For any remaining NaNs, fill with 0
    X = X.fillna(0)

    # Remove rows where target is NaN
    mask = ~y.isna()
    X = X[mask]
    y = y[mask]

    print(f"   Total samples: {len(X)}")
    print(f"   Features: {X.shape[1]}")
    print(f"   Class distribution: UP={y.sum()}, DOWN={len(y)-y.sum()}")

    # Time series split
    split_point = int(len(X) * 0.8)
    X_train = X.iloc[:split_point]
    X_test = X.iloc[split_point:]
    y_train = y.iloc[:split_point]
    y_test = y.iloc[split_point:]

    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples: {len(X_test)}")

    # Train ultra-advanced model
    print("\n7. Training ultra-advanced ensemble...")
    predictor.train_advanced_ensemble(X_train, y_train)

    # Evaluate
    print("\n8. Evaluating model...")
    accuracy, roc_auc = predictor.evaluate(X_test, y_test)

    # Save model
    print("\n9. Saving ultra-advanced model...")
    model_data = {
        'stacking_ensemble': predictor.stacking_ensemble,
        'scaler': predictor.scaler,
        'feature_selector': predictor.feature_selector,
        'feature_names': predictor.feature_names,
        'calibrated_models': predictor.calibrated_models,
        'market_regime_models': predictor.market_regime_models,
        'lstm_model': predictor.lstm_model if TF_AVAILABLE else None,
        'accuracy': accuracy,
        'roc_auc': roc_auc
    }
    joblib.dump(model_data, 'models/ultra_advanced_model.pkl')
    print("   Model saved as 'models/ultra_advanced_model.pkl'")

    # Save LSTM separately if available
    if TF_AVAILABLE and predictor.lstm_model:
        predictor.lstm_model.save('models/lstm_model.h5')
        print("   LSTM model saved as 'models/lstm_model.h5'")

    # Compare with previous models
    try:
        enhanced_model = joblib.load('models/enhanced_spy_model.pkl')
        enhanced_accuracy = enhanced_model.get('accuracy', 0.5451)

        print(f"\n" + "="*50)
        print("MODEL COMPARISON")
        print("="*50)
        print(f"Enhanced Model Accuracy: {enhanced_accuracy:.4f}")
        print(f"Ultra-Advanced Model Accuracy: {accuracy:.4f}")
        print(f"Improvement: {(accuracy - enhanced_accuracy)*100:.2f}%")
        print(f"ROC-AUC Score: {roc_auc:.4f}")

    except Exception as e:
        print(f"\nCouldn't compare with enhanced model: {e}")

    return predictor


if __name__ == "__main__":
    train_ultra_advanced_model()