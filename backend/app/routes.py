"""
API routes for travel time prediction
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime, timedelta
import logging

from .model import get_model
from .utils import engineer_features, calculate_congestion_level

logger = logging.getLogger(__name__)

router = APIRouter()


# Request/Response Models
class PredictRequest(BaseModel):
    origin: str = Field(..., description="Origin location (Singapore or JB)")
    destination: str = Field(..., description="Destination location (JB or Singapore)")
    travel_date: date = Field(..., description="Date of travel (YYYY-MM-DD)")
    travel_time: str = Field(..., description="Time of travel (HH:MM)")
    mode: Optional[str] = Field("car", description="Mode of travel (car, taxi, bus)")

    @validator('origin', 'destination')
    def validate_location(cls, v):
        valid_locations = ['singapore', 'jb', 'johor bahru']
        if v.lower() not in valid_locations:
            raise ValueError(f"Location must be one of: {valid_locations}")
        return v.lower()

    @validator('travel_time')
    def validate_time(cls, v):
        try:
            hour, minute = map(int, v.split(':'))
            if not (0 <= hour < 24 and 0 <= minute < 60):
                raise ValueError
        except:
            raise ValueError("Time must be in HH:MM format (24-hour)")
        return v

    @validator('mode')
    def validate_mode(cls, v):
        valid_modes = ['car', 'taxi', 'bus']
        if v.lower() not in valid_modes:
            raise ValueError(f"Mode must be one of: {valid_modes}")
        return v.lower()


class PredictResponse(BaseModel):
    predicted_time_minutes: float
    lower_bound_minutes: float
    upper_bound_minutes: float
    congestion_level: str
    features_used: dict
    alert: Optional[str] = None


class ScenarioRequest(BaseModel):
    scenarios: List[PredictRequest]


class ScenarioResponse(BaseModel):
    predictions: List[dict]


class HistoricalDataPoint(BaseModel):
    date: str
    hour: int
    avg_travel_time: float
    congestion_level: str


@router.post("/predict", response_model=PredictResponse)
async def predict_travel_time(request: PredictRequest):
    """
    Predict travel time for a given date, time, and route

    Returns predicted travel time with confidence interval and congestion level
    """
    try:
        # Engineer features
        features = engineer_features(
            travel_date=request.travel_date,
            travel_time=request.travel_time,
            origin=request.origin,
            destination=request.destination,
            mode=request.mode
        )

        # Get model and predict
        model = get_model()

        if model.model_loaded:
            predicted_time, lower_bound, upper_bound = model.predict(features)
        else:
            # Fallback prediction if model not loaded
            logger.warning("Using fallback prediction - model not loaded")
            base_time = features.get("historical_avg_time", 30.0)
            predicted_time = base_time
            lower_bound = base_time * 0.85
            upper_bound = base_time * 1.15

        # Calculate congestion level
        congestion_level = calculate_congestion_level(predicted_time)

        # Generate alert if severe congestion expected
        alert = None
        if congestion_level == "severe":
            alert = "⚠️ Severe congestion expected. Consider alternative timing."
        elif congestion_level == "high":
            if features.get("is_peak_hour", 0) == 1:
                alert = "⚠️ Heavy traffic during peak hours. Plan extra time."

        # Add holiday alerts
        if features.get("is_any_holiday", 0) == 1:
            holiday_alert = "🎉 Holiday period - expect increased traffic at borders."
            alert = f"{alert} {holiday_alert}" if alert else holiday_alert

        return PredictResponse(
            predicted_time_minutes=predicted_time,
            lower_bound_minutes=lower_bound,
            upper_bound_minutes=upper_bound,
            congestion_level=congestion_level,
            features_used=features,
            alert=alert
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/simulate", response_model=ScenarioResponse)
async def simulate_scenarios(request: ScenarioRequest):
    """
    Simulate multiple travel scenarios to compare different dates/times

    Useful for planning the best time to travel
    """
    try:
        predictions = []

        for scenario in request.scenarios:
            # Reuse the predict logic
            features = engineer_features(
                travel_date=scenario.travel_date,
                travel_time=scenario.travel_time,
                origin=scenario.origin,
                destination=scenario.destination,
                mode=scenario.mode
            )

            model = get_model()

            if model.model_loaded:
                predicted_time, lower_bound, upper_bound = model.predict(features)
            else:
                base_time = features.get("historical_avg_time", 30.0)
                predicted_time = base_time
                lower_bound = base_time * 0.85
                upper_bound = base_time * 1.15

            congestion_level = calculate_congestion_level(predicted_time)

            predictions.append({
                "date": str(scenario.travel_date),
                "time": scenario.travel_time,
                "predicted_time": predicted_time,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "congestion_level": congestion_level
            })

        return ScenarioResponse(predictions=predictions)

    except Exception as e:
        logger.error(f"Simulation error: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.get("/historical", response_model=List[HistoricalDataPoint])
async def get_historical_data(
    days: int = Query(30, description="Number of days of historical data", ge=1, le=90),
    origin: str = Query("singapore", description="Origin location"),
    destination: str = Query("jb", description="Destination location")
):
    """
    Get historical travel time data for visualization

    Returns data points for the past N days
    """
    try:
        historical_data = []
        today = date.today()

        # Generate historical data for key hours of the day
        key_hours = [7, 8, 9, 12, 17, 18, 19]

        for day_offset in range(days):
            check_date = today - timedelta(days=day_offset)

            for hour in key_hours:
                # Engineer features for this time point
                features = engineer_features(
                    travel_date=check_date,
                    travel_time=f"{hour:02d}:00",
                    origin=origin,
                    destination=destination,
                    mode="car"
                )

                # Use historical average or model prediction
                model = get_model()
                if model.model_loaded:
                    predicted_time, _, _ = model.predict(features)
                else:
                    predicted_time = features.get("historical_avg_time", 30.0)

                congestion_level = calculate_congestion_level(predicted_time)

                historical_data.append(
                    HistoricalDataPoint(
                        date=str(check_date),
                        hour=hour,
                        avg_travel_time=predicted_time,
                        congestion_level=congestion_level
                    )
                )

        return historical_data

    except Exception as e:
        logger.error(f"Historical data error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    model = get_model()
    return {
        "status": "healthy",
        "model_loaded": model.model_loaded
    }
