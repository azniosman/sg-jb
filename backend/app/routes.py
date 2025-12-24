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
from .traffic_apis import GoogleMapsTrafficAPI, LTADataMallAPI, CheckpointWaitTimeEstimator
from .database import db

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize traffic APIs
google_maps_api = GoogleMapsTrafficAPI()
lta_api = LTADataMallAPI()
wait_time_estimator = CheckpointWaitTimeEstimator()


# Request/Response Models
class PredictRequest(BaseModel):
    origin: str = Field(..., description="Origin location (Singapore or JB)")
    destination: str = Field(..., description="Destination location (JB or Singapore)")
    travel_date: date = Field(..., description="Date of travel (YYYY-MM-DD)")
    travel_time: str = Field(..., description="Time of travel (HH:MM)")
    mode: Optional[str] = Field("car", description="Mode of travel (car, taxi, bus)")
    checkpoint: Optional[str] = Field("woodlands", description="Checkpoint (woodlands or tuas)")

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

    @validator('checkpoint')
    def validate_checkpoint(cls, v):
        if v is None:
            return 'woodlands'
        valid_checkpoints = ['woodlands', 'tuas']
        if v.lower() not in valid_checkpoints:
            raise ValueError(f"Checkpoint must be one of: {valid_checkpoints}")
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


class LiveTrafficResponse(BaseModel):
    duration_minutes: float
    duration_in_traffic_minutes: float
    traffic_multiplier: float
    distance_km: float
    timestamp: str
    checkpoint: str
    direction: str


class WaitTimeResponse(BaseModel):
    estimated_wait_minutes: float
    min_wait_minutes: float
    max_wait_minutes: float
    confidence: str
    checkpoint: str
    direction: str


class CrossingSubmission(BaseModel):
    checkpoint: str = Field(..., description="woodlands or tuas")
    origin: str
    destination: str
    mode: str
    actual_travel_time_minutes: float
    actual_wait_time_minutes: Optional[float] = None
    weather_condition: Optional[str] = None
    notes: Optional[str] = None


@router.post("/predict", response_model=PredictResponse)
async def predict_travel_time(request: PredictRequest, use_realtime: bool = Query(True, description="Use real-time traffic data if available")):
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

        # Enhance with real-time traffic if requested and traveling today
        if use_realtime and request.travel_date == date.today():
            try:
                # Use checkpoint from request
                checkpoint = request.checkpoint or "woodlands"

                # Get real-time traffic
                traffic_data = google_maps_api.get_live_travel_time(
                    request.origin,
                    request.destination,
                    checkpoint
                )

                if traffic_data:
                    # Adjust prediction based on real-time traffic multiplier
                    traffic_multiplier = traffic_data.get('traffic_multiplier', 1.0)
                    predicted_time = predicted_time * (0.7 + 0.3 * traffic_multiplier)
                    features['realtime_traffic_multiplier'] = traffic_multiplier
                    logger.info(f"Adjusted prediction with real-time traffic: {traffic_multiplier:.2f}x")

            except Exception as e:
                logger.warning(f"Could not fetch real-time traffic: {e}")

        # Add estimated wait time at checkpoint
        try:
            # Parse travel time
            hour, minute = map(int, request.travel_time.split(':'))
            travel_dt = datetime.combine(request.travel_date, datetime.min.time().replace(hour=hour, minute=minute))

            # Use checkpoint from request
            checkpoint = request.checkpoint or "woodlands"
            direction = "singapore_to_jb" if request.origin.lower() == "singapore" else "jb_to_singapore"

            wait_time_data = wait_time_estimator.estimate_wait_time(
                checkpoint=checkpoint,
                direction=direction,
                hour=hour,
                is_weekend=travel_dt.weekday() >= 5,
                is_holiday=features.get("is_any_holiday", 0) == 1
            )

            estimated_wait = wait_time_data['estimated_wait_minutes']
            predicted_time += estimated_wait
            upper_bound += wait_time_data['max_wait_minutes']
            lower_bound += wait_time_data['min_wait_minutes']

            features['estimated_wait_time'] = estimated_wait
            logger.info(f"Added estimated wait time: {estimated_wait} minutes")

        except Exception as e:
            logger.warning(f"Could not estimate wait time: {e}")

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


@router.get("/traffic/live", response_model=LiveTrafficResponse)
async def get_live_traffic(
    origin: str = Query("singapore", description="Origin location"),
    destination: str = Query("jb", description="Destination location"),
    checkpoint: str = Query("woodlands", description="Checkpoint (woodlands or tuas)")
):
    """
    Get real-time traffic data from Google Maps

    Returns current travel duration with traffic conditions
    """
    try:
        traffic_data = google_maps_api.get_live_travel_time(origin, destination, checkpoint)

        if not traffic_data:
            raise HTTPException(
                status_code=503,
                detail="Real-time traffic data unavailable. API key may not be configured."
            )

        # Store snapshot in database
        direction = f"{origin.lower()}_to_{destination.lower()}"
        db.add_traffic_snapshot({
            'timestamp': datetime.utcnow().isoformat(),
            'checkpoint': checkpoint,
            'direction': direction,
            'traffic_duration_minutes': traffic_data['duration_in_traffic_minutes'],
            'wait_time_minutes': None,
            'congestion_multiplier': traffic_data['traffic_multiplier'],
            'source': 'google_maps',
            'raw_data': traffic_data
        })

        return LiveTrafficResponse(
            duration_minutes=traffic_data['duration_minutes'],
            duration_in_traffic_minutes=traffic_data['duration_in_traffic_minutes'],
            traffic_multiplier=traffic_data['traffic_multiplier'],
            distance_km=traffic_data['distance_meters'] / 1000,
            timestamp=traffic_data['timestamp'],
            checkpoint=checkpoint,
            direction=direction
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Live traffic error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch live traffic: {str(e)}")


@router.get("/checkpoint/wait-time", response_model=WaitTimeResponse)
async def get_wait_time(
    checkpoint: str = Query("woodlands", description="Checkpoint (woodlands or tuas)"),
    origin: str = Query("singapore", description="Origin location"),
    destination: str = Query("jb", description="Destination location"),
    travel_datetime: Optional[datetime] = Query(None, description="Travel datetime (defaults to now)")
):
    """
    Estimate checkpoint wait time based on historical patterns

    Returns estimated wait time with min/max range
    """
    try:
        # Use provided datetime or current time
        dt = travel_datetime or datetime.now()
        hour = dt.hour
        is_weekend = dt.weekday() >= 5

        # Check if it's a holiday (simplified - would use holiday API in production)
        is_holiday = False

        # Determine direction
        direction = "singapore_to_jb" if origin.lower() == "singapore" else "jb_to_singapore"

        # Get wait time estimate
        wait_time_data = wait_time_estimator.estimate_wait_time(
            checkpoint=checkpoint,
            direction=direction,
            hour=hour,
            is_weekend=is_weekend,
            is_holiday=is_holiday
        )

        return WaitTimeResponse(
            estimated_wait_minutes=wait_time_data['estimated_wait_minutes'],
            min_wait_minutes=wait_time_data['min_wait_minutes'],
            max_wait_minutes=wait_time_data['max_wait_minutes'],
            confidence=wait_time_data['confidence'],
            checkpoint=checkpoint,
            direction=direction
        )

    except Exception as e:
        logger.error(f"Wait time estimation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to estimate wait time: {str(e)}")


@router.post("/crossings/submit")
async def submit_crossing(crossing: CrossingSubmission):
    """
    Submit actual crossing data to improve predictions

    Users can report their actual travel times to help improve the model
    """
    try:
        # Prepare crossing data for database
        crossing_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'checkpoint': crossing.checkpoint,
            'origin': crossing.origin,
            'destination': crossing.destination,
            'mode': crossing.mode,
            'travel_time_minutes': crossing.actual_travel_time_minutes,
            'wait_time_minutes': crossing.actual_wait_time_minutes,
            'total_time_minutes': crossing.actual_travel_time_minutes + (crossing.actual_wait_time_minutes or 0),
            'weather_condition': crossing.weather_condition,
            'temperature_c': None,
            'rain_mm': None,
            'is_holiday': None,
            'day_of_week': datetime.utcnow().weekday(),
            'hour_of_day': datetime.utcnow().hour,
            'congestion_level': calculate_congestion_level(crossing.actual_travel_time_minutes),
            'predicted_time_minutes': None,
            'prediction_error_minutes': None
        }

        # Store in database
        crossing_id = db.add_crossing(crossing_data)

        logger.info(f"Crossing data submitted: ID {crossing_id}")

        return {
            "status": "success",
            "crossing_id": crossing_id,
            "message": "Thank you for contributing data to improve predictions!"
        }

    except Exception as e:
        logger.error(f"Crossing submission error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit crossing data: {str(e)}")


@router.get("/crossings/recent")
async def get_recent_crossings(
    checkpoint: Optional[str] = Query(None, description="Filter by checkpoint"),
    hours: int = Query(24, description="Hours of history to fetch", ge=1, le=168),
    limit: int = Query(100, description="Maximum number of records", ge=1, le=500)
):
    """
    Get recent crossing data from the database

    Returns actual crossing reports from users
    """
    try:
        crossings = db.get_recent_crossings(checkpoint=checkpoint, hours=hours, limit=limit)

        return {
            "count": len(crossings),
            "crossings": crossings
        }

    except Exception as e:
        logger.error(f"Recent crossings error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent crossings: {str(e)}")


@router.get("/stats")
async def get_database_stats():
    """
    Get database statistics

    Returns information about stored crossing data
    """
    try:
        stats = db.get_statistics()
        return stats

    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    model = get_model()
    return {
        "status": "healthy",
        "model_loaded": model.model_loaded
    }
