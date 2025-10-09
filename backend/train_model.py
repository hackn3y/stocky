import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
from feature_engineering import calculate_technical_indicators, prepare_model_data

def train_random_forest(X_train, y_train):
    """Train Random Forest model"""

    # Initialize Random Forest - optimized for stock prediction
    rf_model = RandomForestClassifier(
        n_estimators=300,           # Sufficient trees for stability
        max_depth=None,             # Allow full depth (best performance)
        min_samples_split=5,        # Less restrictive splitting
        min_samples_leaf=2,         # Less restrictive leaf nodes
        max_features='sqrt',        # Use sqrt of features per split
        class_weight='balanced',    # Critical: handle class imbalance
        bootstrap=True,             # Use bootstrap samples
        random_state=42,
        n_jobs=-1                   # Use all CPU cores
    )

    # Train model
    print("Training Random Forest model...")
    rf_model.fit(X_train, y_train)

    return rf_model

def train_gradient_boosting(X_train, y_train):
    """Train Gradient Boosting model - often better for stock prediction"""

    # Calculate class weights for balancing
    from sklearn.utils.class_weight import compute_sample_weight
    sample_weights = compute_sample_weight('balanced', y_train)

    # Initialize Gradient Boosting
    gb_model = GradientBoostingClassifier(
        n_estimators=200,           # Number of boosting stages
        learning_rate=0.05,         # Smaller learning rate for better generalization
        max_depth=4,                # Shallow trees to prevent overfitting
        min_samples_split=20,       # Conservative splitting
        min_samples_leaf=10,        # Conservative leaf nodes
        subsample=0.8,              # Use 80% of samples for each tree
        max_features='sqrt',        # Use sqrt of features
        random_state=42,
    )

    # Train model with sample weights
    print("Training Gradient Boosting model...")
    gb_model.fit(X_train, y_train, sample_weight=sample_weights)

    return gb_model

def evaluate_model(model, X_test, y_test):
    """Evaluate model performance"""

    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)

    print("\n=== Model Performance ===")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred,
                                target_names=['Down', 'Up']))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    return accuracy

def feature_importance(model, feature_names):
    """Show feature importance"""

    importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)

    print("\n=== Feature Importance ===")
    print(importance_df)

    return importance_df

if __name__ == "__main__":
    # Load and prepare data
    print("Loading data...")
    df = pd.read_csv('spy_data.csv', index_col=0, parse_dates=True)
    df = calculate_technical_indicators(df)
    X, y, df_clean = prepare_model_data(df)

    # Split data (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, shuffle=False  # Don't shuffle time series!
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Testing samples: {len(X_test)}")

    # Train both models and compare
    print("\n" + "="*50)
    print("COMPARING MODELS")
    print("="*50)

    # Train Random Forest
    rf_model = train_random_forest(X_train, y_train)
    print("\n--- Random Forest Results ---")
    rf_accuracy = evaluate_model(rf_model, X_test, y_test)

    # Train Gradient Boosting
    gb_model = train_gradient_boosting(X_train, y_train)
    print("\n--- Gradient Boosting Results ---")
    gb_accuracy = evaluate_model(gb_model, X_test, y_test)

    # Choose best model
    if gb_accuracy > rf_accuracy:
        print(f"\n[BEST] Gradient Boosting performs better ({gb_accuracy:.4f} vs {rf_accuracy:.4f})")
        best_model = gb_model
        model_name = "Gradient Boosting"
    else:
        print(f"\n[BEST] Random Forest performs better ({rf_accuracy:.4f} vs {gb_accuracy:.4f})")
        best_model = rf_model
        model_name = "Random Forest"

    # Feature importance
    print(f"\n=== {model_name} Feature Importance ===")
    feature_importance(best_model, X.columns)

    # Cross-validation on best model
    print("\n=== Cross-Validation ===")
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=5, scoring='accuracy')
    print(f"CV Scores: {cv_scores}")
    print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")

    # Save best model
    joblib.dump(best_model, 'models/spy_model.pkl')
    print(f"\n{model_name} model saved as 'models/spy_model.pkl'")
