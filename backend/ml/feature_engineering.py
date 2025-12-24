"""
Feature engineering for travel time prediction model
"""
import pandas as pd
import numpy as np
import holidays
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def add_time_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add time-based features

    Args:
        df: DataFrame with 'datetime' column

    Returns:
        DataFrame with additional time features
    """
    logger.info("Adding time-based features")

    # Ensure datetime is parsed
    if 'datetime' not in df.columns and 'date' in df.columns and 'time' in df.columns:
        df['datetime'] = pd.to_datetime(df['date'].astype(str) + ' ' + df['time'].astype(str))

    df['hour_of_day'] = df['datetime'].dt.hour
    df['minute_of_hour'] = df['datetime'].dt.minute
    df['day_of_week'] = df['datetime'].dt.dayofweek  # 0=Monday, 6=Sunday
    df['day_of_month'] = df['datetime'].dt.day
    df['month'] = df['datetime'].dt.month
    df['year'] = df['datetime'].dt.year

    # Weekend indicator
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)

    # Peak hour indicators
    df['is_morning_peak'] = ((df['hour_of_day'] >= 7) & (df['hour_of_day'] <= 9)).astype(int)
    df['is_evening_peak'] = ((df['hour_of_day'] >= 17) & (df['hour_of_day'] <= 19)).astype(int)
    df['is_peak_hour'] = (df['is_morning_peak'] | df['is_evening_peak']).astype(int)

    return df


def add_holiday_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add holiday and school holiday features

    Args:
        df: DataFrame with 'datetime' or 'date' column

    Returns:
        DataFrame with holiday features
    """
    logger.info("Adding holiday features")

    # Get Singapore and Malaysia holidays
    sg_holidays = holidays.Singapore()
    my_holidays = holidays.Malaysia()

    if 'date' not in df.columns:
        df['date'] = df['datetime'].dt.date

    # Public holidays
    df['is_sg_holiday'] = df['date'].apply(lambda x: int(x in sg_holidays))
    df['is_my_holiday'] = df['date'].apply(lambda x: int(x in my_holidays))

    # School holidays (approximate - should be updated annually)
    def is_sg_school_holiday(date):
        month, day = date.month, date.day
        # March holidays
        if month == 3 and 8 <= day <= 16:
            return 1
        # June holidays
        if (month == 5 and day >= 27) or (month == 6 and day <= 25):
            return 1
        # September holidays
        if month == 9 and 2 <= day <= 10:
            return 1
        # Year-end holidays
        if (month == 11 and day >= 18) or month == 12:
            return 1
        return 0

    def is_my_school_holiday(date):
        month, day = date.month, date.day
        # March holidays
        if month == 3 and 20 <= day <= 30:
            return 1
        # Mid-year holidays
        if (month == 5 and day >= 27) or (month == 6 and day <= 11):
            return 1
        # Year-end holidays
        if (month == 11 and day >= 20) or month == 12:
            return 1
        return 0

    df['is_sg_school_holiday'] = df['date'].apply(is_sg_school_holiday)
    df['is_my_school_holiday'] = df['date'].apply(is_my_school_holiday)
    df['is_any_holiday'] = (
        df['is_sg_holiday'] | df['is_my_holiday'] |
        df['is_sg_school_holiday'] | df['is_my_school_holiday']
    ).astype(int)

    return df


def add_mode_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add mode of travel features (one-hot encoding)

    Args:
        df: DataFrame with 'mode' column

    Returns:
        DataFrame with mode features
    """
    logger.info("Adding mode features")

    if 'mode' in df.columns:
        df['mode_car'] = (df['mode'] == 'car').astype(int)
        df['mode_taxi'] = (df['mode'] == 'taxi').astype(int)
        df['mode_bus'] = (df['mode'] == 'bus').astype(int)

    return df


def add_historical_avg_feature(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add historical average travel time feature

    Args:
        df: DataFrame with time features

    Returns:
        DataFrame with historical average feature
    """
    logger.info("Adding historical average features")

    # Calculate historical average by hour and day of week
    if 'travel_time_minutes' in df.columns:
        historical_avg = df.groupby(['hour_of_day', 'day_of_week'])['travel_time_minutes'].transform('mean')
        df['historical_avg_time'] = historical_avg
    else:
        # Use default values based on hour and day
        def get_default_avg(row):
            base = 30.0
            if row['is_peak_hour'] == 1:
                base *= 2.5
            if row['is_weekend'] == 1:
                base *= 0.7
            return base

        df['historical_avg_time'] = df.apply(get_default_avg, axis=1)

    return df


def engineer_all_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply all feature engineering steps

    Args:
        df: Raw dataframe

    Returns:
        DataFrame with all engineered features
    """
    logger.info("Starting feature engineering pipeline")

    df = add_time_features(df)
    df = add_holiday_features(df)
    df = add_mode_features(df)
    df = add_historical_avg_feature(df)

    logger.info("Feature engineering complete")
    return df


def get_feature_columns() -> list:
    """
    Get list of feature columns for model training

    Returns:
        List of feature column names
    """
    return [
        'hour_of_day',
        'minute_of_hour',
        'day_of_week',
        'day_of_month',
        'month',
        'is_weekend',
        'is_morning_peak',
        'is_evening_peak',
        'is_peak_hour',
        'is_sg_holiday',
        'is_my_holiday',
        'is_sg_school_holiday',
        'is_my_school_holiday',
        'is_any_holiday',
        'direction_sg_to_jb',
        'mode_car',
        'mode_taxi',
        'mode_bus',
        'rain_mm',
        'temp_c',
        'historical_avg_time'
    ]


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)

    from .data_loader import generate_synthetic_data

    # Generate data
    df = generate_synthetic_data(1000)

    # Engineer features
    df = engineer_all_features(df)

    print("Feature columns:", get_feature_columns())
    print("\nDataFrame with features:")
    print(df[get_feature_columns()].head())
