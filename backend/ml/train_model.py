"""
Train travel time prediction model
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import lightgbm as lgb
import joblib
from pathlib import Path
import logging
import argparse

from data_loader import load_historical_data, clean_data
from feature_engineering import engineer_all_features, get_feature_columns

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest model"""
    logger.info("Training Random Forest model")

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=20,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    logger.info(f"Random Forest - Train MAE: {mean_absolute_error(y_train, train_pred):.2f}")
    logger.info(f"Random Forest - Test MAE: {mean_absolute_error(y_test, test_pred):.2f}")
    logger.info(f"Random Forest - Test R2: {r2_score(y_test, test_pred):.3f}")

    return model


def train_xgboost(X_train, y_train, X_test, y_test):
    """Train XGBoost model"""
    logger.info("Training XGBoost model")

    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=8,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    logger.info(f"XGBoost - Train MAE: {mean_absolute_error(y_train, train_pred):.2f}")
    logger.info(f"XGBoost - Test MAE: {mean_absolute_error(y_test, test_pred):.2f}")
    logger.info(f"XGBoost - Test R2: {r2_score(y_test, test_pred):.3f}")

    return model


def train_lightgbm(X_train, y_train, X_test, y_test):
    """Train LightGBM model"""
    logger.info("Training LightGBM model")

    model = lgb.LGBMRegressor(
        n_estimators=100,
        max_depth=8,
        learning_rate=0.1,
        num_leaves=31,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )

    model.fit(X_train, y_train)

    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)

    logger.info(f"LightGBM - Train MAE: {mean_absolute_error(y_train, train_pred):.2f}")
    logger.info(f"LightGBM - Test MAE: {mean_absolute_error(y_test, test_pred):.2f}")
    logger.info(f"LightGBM - Test R2: {r2_score(y_test, test_pred):.3f}")

    return model


def plot_feature_importance(model, feature_names, top_n=15):
    """Plot feature importance"""
    try:
        import matplotlib.pyplot as plt

        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            indices = np.argsort(importances)[::-1][:top_n]

            plt.figure(figsize=(10, 6))
            plt.title("Feature Importance")
            plt.bar(range(top_n), importances[indices])
            plt.xticks(range(top_n), [feature_names[i] for i in indices], rotation=45, ha='right')
            plt.tight_layout()
            plt.savefig('feature_importance.png')
            logger.info("Feature importance plot saved to feature_importance.png")

    except ImportError:
        logger.warning("matplotlib not installed, skipping feature importance plot")


def main(data_path=None, model_type='xgboost', output_path='../models/travel_time_model.joblib'):
    """
    Main training pipeline

    Args:
        data_path: Path to training data CSV
        model_type: Type of model to train (random_forest, xgboost, lightgbm)
        output_path: Path to save trained model
    """
    logger.info("Starting training pipeline")

    # Load data
    df = load_historical_data(data_path)
    df = clean_data(df)

    # Engineer features
    df = engineer_all_features(df)

    # Prepare features and target
    feature_cols = get_feature_columns()
    X = df[feature_cols]
    y = df['travel_time_minutes']

    logger.info(f"Dataset shape: {X.shape}")
    logger.info(f"Features: {feature_cols}")

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")

    # Train model
    if model_type == 'random_forest':
        model = train_random_forest(X_train, y_train, X_test, y_test)
    elif model_type == 'xgboost':
        model = train_xgboost(X_train, y_train, X_test, y_test)
    elif model_type == 'lightgbm':
        model = train_lightgbm(X_train, y_train, X_test, y_test)
    else:
        raise ValueError(f"Unknown model type: {model_type}")

    # Plot feature importance
    plot_feature_importance(model, feature_cols)

    # Save model
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, output_path)
    logger.info(f"Model saved to {output_path}")

    # Print summary
    test_pred = model.predict(X_test)
    logger.info("\n" + "="*50)
    logger.info("FINAL MODEL PERFORMANCE")
    logger.info("="*50)
    logger.info(f"Model Type: {model_type}")
    logger.info(f"Test MAE: {mean_absolute_error(y_test, test_pred):.2f} minutes")
    logger.info(f"Test RMSE: {np.sqrt(mean_squared_error(y_test, test_pred)):.2f} minutes")
    logger.info(f"Test R2 Score: {r2_score(y_test, test_pred):.3f}")
    logger.info("="*50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train travel time prediction model')
    parser.add_argument('--data', type=str, default=None, help='Path to training data CSV')
    parser.add_argument('--model', type=str, default='xgboost',
                        choices=['random_forest', 'xgboost', 'lightgbm'],
                        help='Type of model to train')
    parser.add_argument('--output', type=str, default='../models/travel_time_model.joblib',
                        help='Path to save trained model')

    args = parser.parse_args()

    main(
        data_path=args.data,
        model_type=args.model,
        output_path=args.output
    )
