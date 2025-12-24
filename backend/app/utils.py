"""
Utility functions for feature engineering and external API calls
"""
import requests
import holidays
from datetime import datetime, date
from typing import Dict, Optional, Tuple
import logging
from .config import settings

logger = logging.getLogger(__name__)


class HolidayChecker:
    """Check if a date is a holiday in Singapore or Malaysia"""

    def __init__(self):
        self.sg_holidays = holidays.Singapore()
        self.my_holidays = holidays.Malaysia()

    def is_singapore_holiday(self, check_date: date) -> bool:
        """Check if date is a Singapore public holiday"""
        return check_date in self.sg_holidays

    def is_malaysia_holiday(self, check_date: date) -> bool:
        """Check if date is a Malaysia public holiday"""
        return check_date in self.my_holidays

    def is_school_holiday_sg(self, check_date: date) -> bool:
        """
        Check if date falls in Singapore school holidays
        Approximate dates - should be updated annually
        """
        year = check_date.year
        month = check_date.month
        day = check_date.day

        # Singapore school holidays (approximate)
        # March holidays
        if month == 3 and 8 <= day <= 16:
            return True
        # June holidays
        if month == 5 and day >= 27 or month == 6 and day <= 25:
            return True
        # September holidays
        if month == 9 and 2 <= day <= 10:
            return True
        # Year-end holidays
        if month == 11 and day >= 18 or month == 12 and day <= 31:
            return True

        return False

    def is_school_holiday_my(self, check_date: date) -> bool:
        """
        Check if date falls in Malaysia school holidays
        Approximate dates - should be updated annually
        """
        year = check_date.year
        month = check_date.month
        day = check_date.day

        # Malaysia school holidays (approximate)
        # March holidays
        if month == 3 and 20 <= day <= 30:
            return True
        # Mid-year holidays
        if month == 5 and day >= 27 or month == 6 and day <= 11:
            return True
        # Year-end holidays
        if month == 11 and day >= 20 or month == 12 and day <= 31:
            return True

        return False


class WeatherAPI:
    """Fetch weather data from OpenWeatherMap API"""

    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

    # Coordinates for Johor Bahru causeway area
    JB_LAT = 1.4655
    JB_LON = 103.7578

    def __init__(self, api_key: str):
        self.api_key = api_key

    def get_current_weather(self) -> Dict[str, float]:
        """
        Get current weather data for JB area
        Returns: dict with rain_mm and temp_c
        """
        try:
            params = {
                "lat": self.JB_LAT,
                "lon": self.JB_LON,
                "appid": self.api_key,
                "units": "metric"
            }

            response = requests.get(self.BASE_URL, params=params, timeout=5)
            response.raise_for_status()
            data = response.json()

            # Extract rain and temperature
            rain_mm = 0.0
            if "rain" in data and "1h" in data["rain"]:
                rain_mm = data["rain"]["1h"]

            temp_c = data["main"]["temp"]

            return {
                "rain_mm": rain_mm,
                "temp_c": temp_c
            }

        except Exception as e:
            logger.warning(f"Failed to fetch weather data: {e}")
            # Return default values
            return {
                "rain_mm": 0.0,
                "temp_c": 30.0  # Default tropical temperature
            }


class TrafficAPI:
    """Fetch historical traffic data"""

    def __init__(self, google_api_key: str = None, lta_api_key: str = None):
        self.google_api_key = google_api_key
        self.lta_api_key = lta_api_key

    def get_historical_avg_travel_time(self, hour: int, day_of_week: int) -> float:
        """
        Get historical average travel time for given hour and day of week
        In production, this would query a database of historical data
        For now, returns estimated values based on typical patterns
        """
        # Base travel time in minutes (without traffic)
        base_time = 30.0

        # Peak hours multiplier
        if hour in [7, 8, 9, 17, 18, 19]:  # Morning and evening peaks
            peak_multiplier = 2.5
        elif hour in [6, 10, 16, 20]:  # Shoulder peaks
            peak_multiplier = 1.8
        else:
            peak_multiplier = 1.0

        # Weekend adjustment (typically less congested)
        if day_of_week in [5, 6]:  # Saturday, Sunday
            peak_multiplier *= 0.7

        return base_time * peak_multiplier


def engineer_features(
    travel_date: date,
    travel_time: str,
    origin: str,
    destination: str,
    mode: str = "car"
) -> Dict[str, float]:
    """
    Engineer features for ML model prediction

    Args:
        travel_date: Date of travel
        travel_time: Time of travel (HH:MM format)
        origin: Starting location
        destination: Destination location
        mode: Mode of travel (car, taxi, bus)

    Returns:
        Dictionary of engineered features
    """
    # Parse time
    hour, minute = map(int, travel_time.split(":"))
    dt = datetime.combine(travel_date, datetime.min.time().replace(hour=hour, minute=minute))

    # Time-based features
    features = {
        "hour_of_day": hour,
        "minute_of_hour": minute,
        "day_of_week": dt.weekday(),  # 0=Monday, 6=Sunday
        "day_of_month": dt.day,
        "month": dt.month,
        "is_weekend": 1 if dt.weekday() >= 5 else 0,
    }

    # Holiday features
    holiday_checker = HolidayChecker()
    features["is_sg_holiday"] = 1 if holiday_checker.is_singapore_holiday(travel_date) else 0
    features["is_my_holiday"] = 1 if holiday_checker.is_malaysia_holiday(travel_date) else 0
    features["is_sg_school_holiday"] = 1 if holiday_checker.is_school_holiday_sg(travel_date) else 0
    features["is_my_school_holiday"] = 1 if holiday_checker.is_school_holiday_my(travel_date) else 0
    features["is_any_holiday"] = max(
        features["is_sg_holiday"],
        features["is_my_holiday"],
        features["is_sg_school_holiday"],
        features["is_my_school_holiday"]
    )

    # Direction feature
    features["direction_sg_to_jb"] = 1 if origin.lower() == "singapore" else 0

    # Mode features (one-hot encoding)
    features["mode_car"] = 1 if mode == "car" else 0
    features["mode_taxi"] = 1 if mode == "taxi" else 0
    features["mode_bus"] = 1 if mode == "bus" else 0

    # Weather features (only available for current/near-future predictions)
    if settings.openweather_api_key:
        weather_api = WeatherAPI(settings.openweather_api_key)
        weather = weather_api.get_current_weather()
        features["rain_mm"] = weather["rain_mm"]
        features["temp_c"] = weather["temp_c"]
    else:
        features["rain_mm"] = 0.0
        features["temp_c"] = 30.0

    # Historical average travel time for this hour/day combination
    traffic_api = TrafficAPI()
    features["historical_avg_time"] = traffic_api.get_historical_avg_travel_time(
        hour, dt.weekday()
    )

    # Peak hour indicators
    features["is_morning_peak"] = 1 if 7 <= hour <= 9 else 0
    features["is_evening_peak"] = 1 if 17 <= hour <= 19 else 0
    features["is_peak_hour"] = max(features["is_morning_peak"], features["is_evening_peak"])

    return features


def calculate_congestion_level(predicted_time: float, base_time: float = 30.0) -> str:
    """
    Calculate congestion level based on predicted vs base travel time

    Args:
        predicted_time: Predicted travel time in minutes
        base_time: Base travel time without traffic

    Returns:
        Congestion level: "low", "moderate", "high", "severe"
    """
    ratio = predicted_time / base_time

    if ratio < 1.2:
        return "low"
    elif ratio < 1.5:
        return "moderate"
    elif ratio < 2.0:
        return "high"
    else:
        return "severe"
