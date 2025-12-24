"""
Data loader for travel time dataset
This module handles loading and preprocessing historical travel data
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


def generate_synthetic_data(num_samples: int = 10000) -> pd.DataFrame:
    """
    Generate synthetic training data for demonstration
    In production, replace with actual historical data

    Args:
        num_samples: Number of samples to generate

    Returns:
        DataFrame with synthetic travel time data
    """
    logger.info(f"Generating {num_samples} synthetic data samples")

    np.random.seed(42)
    data = []

    # Generate data over past 2 years
    start_date = datetime.now() - timedelta(days=730)

    for _ in range(num_samples):
        # Random date and time
        random_days = np.random.randint(0, 730)
        random_hour = np.random.randint(0, 24)
        random_minute = np.random.choice([0, 15, 30, 45])

        travel_datetime = start_date + timedelta(days=random_days, hours=random_hour, minutes=random_minute)

        # Base travel time
        base_time = 30.0

        # Time of day effect
        hour = travel_datetime.hour
        if 7 <= hour <= 9:  # Morning peak
            time_multiplier = np.random.uniform(2.0, 3.0)
        elif 17 <= hour <= 19:  # Evening peak
            time_multiplier = np.random.uniform(2.2, 3.2)
        elif 6 <= hour <= 10 or 16 <= hour <= 20:  # Shoulder hours
            time_multiplier = np.random.uniform(1.5, 2.0)
        else:
            time_multiplier = np.random.uniform(0.8, 1.2)

        # Day of week effect
        day_of_week = travel_datetime.weekday()
        if day_of_week >= 5:  # Weekend
            time_multiplier *= 0.7

        # Random weather effect
        rain_mm = np.random.exponential(2.0) if np.random.random() < 0.3 else 0
        if rain_mm > 5:
            time_multiplier *= 1.3

        # Temperature effect (minor)
        temp_c = np.random.normal(30, 3)

        # Direction (Singapore to JB or vice versa)
        direction = np.random.choice([0, 1])

        # Mode of travel
        mode = np.random.choice(['car', 'taxi', 'bus'], p=[0.6, 0.2, 0.2])

        # Calculate travel time with noise
        travel_time = base_time * time_multiplier
        travel_time += np.random.normal(0, 3)  # Add some noise
        travel_time = max(15, travel_time)  # Minimum 15 minutes

        data.append({
            'datetime': travel_datetime,
            'date': travel_datetime.date(),
            'time': travel_datetime.time(),
            'hour': hour,
            'minute': random_minute,
            'day_of_week': day_of_week,
            'direction_sg_to_jb': direction,
            'mode': mode,
            'rain_mm': rain_mm,
            'temp_c': temp_c,
            'travel_time_minutes': travel_time
        })

    df = pd.DataFrame(data)
    logger.info(f"Generated dataset shape: {df.shape}")
    return df


def load_historical_data(filepath: str = None) -> pd.DataFrame:
    """
    Load historical travel time data

    Args:
        filepath: Path to CSV file with historical data

    Returns:
        DataFrame with historical data

    Expected CSV columns:
        - datetime: timestamp of travel
        - origin: starting location
        - destination: ending location
        - mode: mode of travel
        - travel_time_minutes: actual travel time
        - weather_condition: weather at time of travel
        - rain_mm: rainfall in mm
        - temp_c: temperature in celsius
    """
    if filepath is None:
        # Use synthetic data if no file provided
        logger.warning("No data file provided, generating synthetic data")
        return generate_synthetic_data()

    try:
        logger.info(f"Loading data from {filepath}")
        df = pd.read_csv(filepath)

        # Parse datetime if needed
        if 'datetime' in df.columns:
            df['datetime'] = pd.to_datetime(df['datetime'])

        logger.info(f"Loaded dataset shape: {df.shape}")
        return df

    except FileNotFoundError:
        logger.warning(f"File not found: {filepath}, generating synthetic data")
        return generate_synthetic_data()


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and preprocess the dataset

    Args:
        df: Raw dataframe

    Returns:
        Cleaned dataframe
    """
    logger.info("Cleaning data")

    # Remove duplicates
    df = df.drop_duplicates()

    # Remove outliers (travel times outside reasonable range)
    df = df[(df['travel_time_minutes'] >= 10) & (df['travel_time_minutes'] <= 300)]

    # Handle missing values
    df = df.dropna(subset=['travel_time_minutes'])

    # Fill missing weather data with defaults
    if 'rain_mm' in df.columns:
        df['rain_mm'] = df['rain_mm'].fillna(0)
    if 'temp_c' in df.columns:
        df['temp_c'] = df['temp_c'].fillna(30.0)

    logger.info(f"Cleaned dataset shape: {df.shape}")
    return df


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    # Generate and save synthetic data
    df = generate_synthetic_data(10000)
    output_path = "synthetic_travel_data.csv"
    df.to_csv(output_path, index=False)
    print(f"Synthetic data saved to {output_path}")
    print(df.head())
    print(df.describe())
