"""
Optimized Stock Prediction Model
Practical improvements that actually work:
1. LightGBM and CatBoost for better performance
2. Better hyperparameter tuning with Optuna
3. Stacking ensemble
4. Confidence calibration
5. Robust feature engineering
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import StackingClassifier
import joblib
import warnings
warnings.filterwarnings('ignore')

# Import libraries if available
try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False

try:
    import catboost as cb
    CATBOOST_AVAILABLE = True
except ImportError:
    CATBOOST_AVAILABLE = False

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    import optuna
    optuna.logging.set_verbosity(optuna.logging.WARNING)
    OPTUNA_AVAILABLE = True
except ImportError:
    OPTUNA_AVAILABLE = False

from feature_engineering import calculate_technical_indicators, prepare_model_data


class OptimizedStockPredictor:
    """Optimized ensemble model with practical improvements"""

    def __init__(self):
        self.scaler = StandardScaler()
        self.feature_selector = SelectKBest(mutual_info_classif, k=35)
        self.base_models = {}
        self.stacking_ensemble = None
        self.feature_names = None
        self.best_params = {}

    def add_robust_features(self, df):
        """Add robust engineered features that don't create too many NaNs"""

        # Price action features
        df['Price_Momentum'] = df['Close'].pct_change(5)
        df['Price_Acceleration'] = df['Price_Momentum'].diff()

        # Volume features
        df['Volume_MA_Ratio'] = df['Volume'] / df['Volume'].rolling(20).mean()
        df['Volume_Trend'] = df['Volume'].rolling(10).mean() / df['Volume'].rolling(50).mean()

        # Volatility features
        df['Volatility_Ratio'] = df['Volatility'] / df['Volatility'].rolling(20).mean()
        df['Volatility_Trend'] = df['Volatility'].diff()

        # Support/Resistance
        df['Distance_from_High'] = (df['High'].rolling(20).max() - df['Close']) / df['Close']
        df['Distance_from_Low'] = (df['Close'] - df['Low'].rolling(20).min()) / df['Close']

        # Market strength
        df['Advance_Decline'] = (df['Close'] > df['Open']).astype(int).rolling(20).mean()
        df['High_Low_Spread'] = (df['High'] - df['Low']) / df['Close']

        # Trend features
        df['Trend_Strength'] = abs(df['SMA_5_20_Ratio'] - 1) if 'SMA_5_20_Ratio' in df.columns else 0
        df['Trend_Consistency'] = df['Daily_Return'].rolling(10).apply(lambda x: np.sum(x > 0) / len(x))

        # Efficiency ratio
        direction = abs(df['Close'].diff(10))
        volatility = df['Close'].diff().abs().rolling(10).sum()
        df['Efficiency_Ratio'] = direction / (volatility + 0.001)

        # Pattern recognition
        df['Inside_Bar'] = ((df['High'] < df['High'].shift(1)) &
                           (df['Low'] > df['Low'].shift(1))).astype(int)
        df['Breakout'] = ((df['High'] > df['High'].rolling(20).max().shift(1)) |
                         (df['Low'] < df['Low'].rolling(20).min().shift(1))).astype(int)

        # Risk indicators
        df['Downside_Risk'] = df['Daily_Return'].rolling(20).apply(
            lambda x: np.std(x[x < 0]) if len(x[x < 0]) > 0 else 0
        )

        # Market regime
        df['Volatility_Regime'] = pd.qcut(df['Volatility'].rolling(20).mean(),
                                         q=3, labels=[0, 1, 2], duplicates='drop')

        return df

    def optimize_lgb_params(self, X_train, y_train):
        """Optimize LightGBM parameters using Optuna"""

        if not OPTUNA_AVAILABLE or not LGB_AVAILABLE:
            return {
                'n_estimators': 300,
                'max_depth': 5,
                'learning_rate': 0.03,
                'num_leaves': 31,
                'min_child_samples': 20,
                'subsample': 0.8,
                'colsample_bytree': 0.8
            }

        def objective(trial):
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 500),
                'max_depth': trial.suggest_int('max_depth', 3, 8),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1, log=True),
                'num_leaves': trial.suggest_int('num_leaves', 20, 100),
                'min_child_samples': trial.suggest_int('min_child_samples', 10, 50),
                'subsample': trial.suggest_float('subsample', 0.5, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
                'reg_alpha': trial.suggest_float('reg_alpha', 0.0, 1.0),
                'reg_lambda': trial.suggest_float('reg_lambda', 0.0, 1.0),
            }

            model = lgb.LGBMClassifier(**params, random_state=42, verbose=-1)
            tscv = TimeSeriesSplit(n_splits=3)
            scores = cross_val_score(model, X_train, y_train, cv=tscv, scoring='roc_auc', n_jobs=-1)
            return scores.mean()

        print("Optimizing LightGBM parameters...")
        study = optuna.create_study(direction='maximize', sampler=optuna.samplers.TPESampler(seed=42))
        study.optimize(objective, n_trials=15, show_progress_bar=False)

        best_params = study.best_params
        print(f"Best LightGBM params: ROC-AUC = {study.best_value:.4f}")
        return best_params

    def create_optimized_models(self):
        """Create optimized base models"""

        # 1. LightGBM (if available)
        if LGB_AVAILABLE:
            lgb_params = self.best_params.get('lgb', {
                'n_estimators': 300,
                'max_depth': 5,
                'learning_rate': 0.03,
                'num_leaves': 31,
                'min_child_samples': 20,
                'subsample': 0.8,
                'colsample_bytree': 0.8,
                'reg_alpha': 0.1,
                'reg_lambda': 0.1
            })
            self.base_models['lgb'] = lgb.LGBMClassifier(
                **lgb_params,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )

        # 2. CatBoost (if available)
        if CATBOOST_AVAILABLE:
            self.base_models['catboost'] = cb.CatBoostClassifier(
                iterations=300,
                depth=6,
                learning_rate=0.03,
                l2_leaf_reg=3,
                random_seed=42,
                verbose=False
            )

        # 3. XGBoost (if available)
        if XGB_AVAILABLE:
            self.base_models['xgb'] = xgb.XGBClassifier(
                n_estimators=300,
                max_depth=5,
                learning_rate=0.03,
                subsample=0.8,
                colsample_bytree=0.8,
                min_child_weight=3,
                gamma=0.1,
                random_state=42,
                use_label_encoder=False,
                eval_metric='logloss'
            )

        # 4. Gradient Boosting
        self.base_models['gb'] = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42
        )

        # 5. Extra Trees
        self.base_models['extra_trees'] = ExtraTreesClassifier(
            n_estimators=300,
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=4,
            max_features='sqrt',
            bootstrap=False,
            random_state=42,
            n_jobs=-1
        )

        # 6. Random Forest
        self.base_models['rf'] = RandomForestClassifier(
            n_estimators=300,
            max_depth=10,
            min_samples_split=10,
            min_samples_leaf=4,
            max_features='sqrt',
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )

        # 7. Neural Network
        self.base_models['mlp'] = MLPClassifier(
            hidden_layer_sizes=(150, 75, 30),
            activation='relu',
            solver='adam',
            alpha=0.01,
            learning_rate='adaptive',
            max_iter=500,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=42
        )

    def train_stacking_ensemble(self, X_train, y_train):
        """Train optimized stacking ensemble"""

        print("Training optimized stacking ensemble...")

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)

        # Feature selection
        X_train_selected = self.feature_selector.fit_transform(X_train_scaled, y_train)

        # Store selected features
        selected_indices = self.feature_selector.get_support(indices=True)
        self.feature_names = X_train.columns[selected_indices].tolist()

        # Optimize LightGBM if available
        if LGB_AVAILABLE and OPTUNA_AVAILABLE:
            self.best_params['lgb'] = self.optimize_lgb_params(X_train_selected, y_train)

        # Create models
        self.create_optimized_models()

        # Train and evaluate base models
        print("\nTraining base models...")
        tscv = TimeSeriesSplit(n_splits=3)

        model_scores = {}
        for name, model in self.base_models.items():
            scores = []
            for train_idx, val_idx in tscv.split(X_train_selected):
                X_t, X_v = X_train_selected[train_idx], X_train_selected[val_idx]
                y_t, y_v = y_train.iloc[train_idx], y_train.iloc[val_idx]

                if name == 'catboost':
                    model.fit(X_t, y_t, eval_set=(X_v, y_v), verbose=False)
                else:
                    model.fit(X_t, y_t)

                try:
                    score = roc_auc_score(y_v, model.predict_proba(X_v)[:, 1])
                except:
                    score = accuracy_score(y_v, model.predict(X_v))
                scores.append(score)

            avg_score = np.mean(scores)
            model_scores[name] = avg_score
            print(f"{name}: Score = {avg_score:.4f}")

        # Calibrate models for better probabilities
        print("\nCalibrating models...")
        calibrated_models = []
        for name, model in self.base_models.items():
            # Train on full data
            if name == 'catboost':
                model.fit(X_train_selected, y_train, verbose=False)
            else:
                model.fit(X_train_selected, y_train)

            # Calibrate
            calibrated = CalibratedClassifierCV(model, method='sigmoid', cv=3)
            calibrated.fit(X_train_selected, y_train)
            calibrated_models.append((name, calibrated))

        # Create meta-learner
        meta_learner = LogisticRegression(
            C=1.0,
            max_iter=1000,
            class_weight='balanced',
            random_state=42
        )

        # Create stacking classifier
        self.stacking_ensemble = StackingClassifier(
            estimators=calibrated_models,
            final_estimator=meta_learner,
            cv=3,
            stack_method='predict_proba',
            n_jobs=-1
        )

        # Train stacking ensemble
        print("Training final stacking ensemble...")
        self.stacking_ensemble.fit(X_train_selected, y_train)

        return self

    def predict(self, X):
        """Make predictions"""
        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)
        return self.stacking_ensemble.predict(X_selected)

    def predict_proba(self, X):
        """Get prediction probabilities"""
        X_scaled = self.scaler.transform(X)
        X_selected = self.feature_selector.transform(X_scaled)
        return self.stacking_ensemble.predict_proba(X_selected)

    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""

        y_pred = self.predict(X_test)
        y_proba = self.predict_proba(X_test)

        accuracy = accuracy_score(y_test, y_pred)
        try:
            roc_auc = roc_auc_score(y_test, y_proba[:, 1])
        except:
            roc_auc = 0.5

        print("\n" + "="*50)
        print("OPTIMIZED MODEL PERFORMANCE")
        print("="*50)
        print(f"Test Accuracy: {accuracy:.4f}")
        print(f"ROC-AUC Score: {roc_auc:.4f}")

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=['Down', 'Up']))

        # Confidence analysis
        confidence = np.max(y_proba, axis=1)
        for threshold in [0.6, 0.65, 0.7]:
            high_conf_mask = confidence > threshold
            if high_conf_mask.sum() > 0:
                high_conf_acc = accuracy_score(y_test[high_conf_mask], y_pred[high_conf_mask])
                print(f"\nConfidence > {threshold}: {high_conf_mask.sum()}/{len(y_test)}")
                print(f"Accuracy: {high_conf_acc:.4f}")

        print(f"\nTop 15 Features:")
        for i, feat in enumerate(self.feature_names[:15]):
            print(f"  {i+1}. {feat}")

        return accuracy, roc_auc


def train_optimized_model():
    """Main training function"""

    print("="*60)
    print("TRAINING OPTIMIZED STOCK PREDICTION MODEL")
    print("="*60)

    # Load data
    print("\n1. Loading data...")
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)

    # Calculate technical indicators
    print("2. Calculating technical indicators...")
    df = calculate_technical_indicators(df)

    # Add robust features
    print("3. Adding robust engineered features...")
    predictor = OptimizedStockPredictor()
    df = predictor.add_robust_features(df)

    # Prepare model data
    print("4. Preparing model data...")
    X, y, df_clean = prepare_model_data(df)

    # Add the new robust features
    robust_features = [
        'Price_Momentum', 'Price_Acceleration', 'Volume_MA_Ratio', 'Volume_Trend',
        'Volatility_Ratio', 'Volatility_Trend', 'Distance_from_High', 'Distance_from_Low',
        'Advance_Decline', 'High_Low_Spread', 'Trend_Strength', 'Trend_Consistency',
        'Efficiency_Ratio', 'Inside_Bar', 'Breakout', 'Downside_Risk', 'Volatility_Regime'
    ]

    X = X.copy()
    for feat in robust_features:
        if feat in df_clean.columns:
            X[feat] = df_clean.loc[X.index, feat].values

    # Clean data
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.ffill().bfill()
    X = X.fillna(0)

    # Remove any rows with NaN targets
    mask = ~y.isna()
    X = X[mask]
    y = y[mask]

    print(f"   Total samples: {len(X)}")
    print(f"   Features: {X.shape[1]}")
    print(f"   Class distribution: UP={y.sum()}, DOWN={len(y)-y.sum()}")

    # Split data
    split_point = int(len(X) * 0.8)
    X_train = X.iloc[:split_point]
    X_test = X.iloc[split_point:]
    y_train = y.iloc[:split_point]
    y_test = y.iloc[split_point:]

    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples: {len(X_test)}")

    # Train model
    print("\n5. Training optimized ensemble...")
    predictor.train_stacking_ensemble(X_train, y_train)

    # Evaluate
    print("\n6. Evaluating model...")
    accuracy, roc_auc = predictor.evaluate(X_test, y_test)

    # Save model
    print("\n7. Saving optimized model...")
    model_data = {
        'stacking_ensemble': predictor.stacking_ensemble,
        'scaler': predictor.scaler,
        'feature_selector': predictor.feature_selector,
        'feature_names': predictor.feature_names,
        'accuracy': accuracy,
        'roc_auc': roc_auc
    }
    joblib.dump(model_data, 'models/optimized_model.pkl')
    print("   Model saved as 'models/optimized_model.pkl'")

    # Compare with previous models
    try:
        enhanced_model = joblib.load('models/enhanced_spy_model.pkl')
        enhanced_acc = enhanced_model.get('accuracy', 0.5451)

        print("\n" + "="*50)
        print("MODEL COMPARISON")
        print("="*50)
        print(f"Enhanced Model: {enhanced_acc:.4f}")
        print(f"Optimized Model: {accuracy:.4f}")
        print(f"Improvement: {(accuracy - enhanced_acc)*100:.2f}%")

    except:
        pass

    return predictor


if __name__ == "__main__":
    train_optimized_model()