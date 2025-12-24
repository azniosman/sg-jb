"""
ML Model management - loading and prediction
"""
import joblib
import numpy as np
from typing import Dict, Tuple
import logging
from pathlib import Path
from google.cloud import storage
from .config import settings

logger = logging.getLogger(__name__)


class TravelTimeModel:
    """Wrapper for travel time prediction ML model"""

    def __init__(self):
        self.model = None
        self.feature_names = None
        self.model_loaded = False

    def load_model_from_gcs(self, bucket_name: str, blob_name: str):
        """Load model from Google Cloud Storage"""
        try:
            logger.info(f"Loading model from GCS: {bucket_name}/{blob_name}")
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(blob_name)

            # Download to temporary file
            temp_path = "/tmp/model.joblib"
            blob.download_to_filename(temp_path)

            # Load model
            self.model = joblib.load(temp_path)
            self.model_loaded = True
            logger.info("Model loaded successfully from GCS")

        except Exception as e:
            logger.error(f"Failed to load model from GCS: {e}")
            raise

    def load_model_local(self, model_path: str):
        """Load model from local filesystem"""
        try:
            logger.info(f"Loading model from local path: {model_path}")
            path = Path(model_path)

            if not path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")

            self.model = joblib.load(model_path)
            self.model_loaded = True
            logger.info("Model loaded successfully from local filesystem")

        except Exception as e:
            logger.error(f"Failed to load model locally: {e}")
            raise

    def load_model(self):
        """Load model based on configuration"""
        if settings.use_gcs:
            self.load_model_from_gcs(
                settings.gcs_bucket_name,
                settings.model_blob_name
            )
        else:
            self.load_model_local(settings.model_path)

        # Extract feature names if available
        if hasattr(self.model, 'feature_names_in_'):
            self.feature_names = self.model.feature_names_in_.tolist()

    def predict(self, features: Dict[str, float]) -> Tuple[float, float, float]:
        """
        Make prediction with confidence interval

        Args:
            features: Dictionary of feature values

        Returns:
            Tuple of (predicted_time, lower_bound, upper_bound)
        """
        if not self.model_loaded:
            raise RuntimeError("Model not loaded")

        try:
            # Prepare feature array
            if self.feature_names:
                # Ensure features are in the correct order
                feature_array = np.array([[features.get(name, 0.0) for name in self.feature_names]])
            else:
                # Use features in sorted order by key
                sorted_keys = sorted(features.keys())
                feature_array = np.array([[features[k] for k in sorted_keys]])

            # Make prediction
            prediction = self.model.predict(feature_array)[0]

            # Calculate confidence interval (simplified)
            # In production, use proper uncertainty estimation
            # For tree-based models, can use std of tree predictions
            if hasattr(self.model, 'estimators_'):
                # For ensemble models (RandomForest, XGBoost, LightGBM)
                tree_predictions = []
                for estimator in self.model.estimators_[:50]:  # Sample first 50 trees
                    if hasattr(estimator, 'predict'):
                        tree_pred = estimator.predict(feature_array)[0]
                        tree_predictions.append(tree_pred)

                if tree_predictions:
                    std = np.std(tree_predictions)
                    lower_bound = max(0, prediction - 1.96 * std)  # 95% CI
                    upper_bound = prediction + 1.96 * std
                else:
                    # Fallback: ±15% of prediction
                    lower_bound = prediction * 0.85
                    upper_bound = prediction * 1.15
            else:
                # Fallback for non-ensemble models
                lower_bound = prediction * 0.85
                upper_bound = prediction * 1.15

            return float(prediction), float(lower_bound), float(upper_bound)

        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise


# Global model instance
travel_time_model = TravelTimeModel()


def initialize_model():
    """Initialize the global model instance"""
    try:
        travel_time_model.load_model()
        logger.info("Travel time model initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize model: {e}")
        logger.warning("API will run without ML model - using fallback predictions")


def get_model() -> TravelTimeModel:
    """Get the global model instance"""
    return travel_time_model
