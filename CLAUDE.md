# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a production-ready web application that predicts travel times between Singapore and Johor Bahru (JB) using machine learning. The application consists of a React frontend and Python FastAPI backend, designed for deployment on Google Cloud Run.

**Key Technologies:**
- Backend: Python 3.11, FastAPI, XGBoost/LightGBM, scikit-learn
- Frontend: React 18, Leaflet (maps), Recharts (analytics)
- Deployment: Docker, Google Cloud Run
- APIs: OpenWeatherMap (weather), Google Maps (traffic), LTA DataMall

## Common Commands

### Development

```bash
# Start full stack with Docker Compose
docker-compose up --build

# Backend development (from backend/)
conda env create -f environment.yml              # Setup conda env (recommended)
conda activate sg-jb-backend                     # Activate environment
uvicorn app.main:app --reload --port 8000        # Run dev server
python -m pytest                                  # Run tests

# Test new real-time endpoints
curl "http://localhost:8000/api/v1/traffic/live?origin=singapore&destination=jb"
curl "http://localhost:8000/api/v1/checkpoint/wait-time?checkpoint=woodlands"
curl http://localhost:8000/api/v1/stats           # Database statistics

# Train ML model (from backend/)
python -m ml.train_model --model xgboost         # Train XGBoost
python -m ml.train_model --model lightgbm        # Train LightGBM
python -m ml.train_model --model random_forest   # Train RF

# Frontend development (from frontend/)
npm install                                       # Install deps
npm start                                        # Run dev server (port 3000)
npm test                                         # Run tests
npm run build                                    # Production build
```

### Deployment

```bash
# Deploy to Google Cloud Run
./deploy-cloud-run.sh                            # Automated deployment

# Or manually
gcloud builds submit --config cloudbuild.yaml    # Cloud Build

# Upload trained model to GCS
gsutil cp backend/models/travel_time_model.joblib gs://sg-jb-ml-models/
```

## Architecture

### Backend Structure (`backend/app/`)

- **main.py**: FastAPI application initialization, CORS setup, lifespan management
- **routes.py**: API endpoints (`/predict`, `/simulate`, `/historical`, `/traffic/live`, `/checkpoint/wait-time`, `/crossings/*`)
- **model.py**: ML model loading (local or GCS), prediction with confidence intervals
- **utils.py**: Feature engineering, holiday checking, weather/traffic APIs
- **config.py**: Pydantic settings, environment variable management
- **traffic_apis.py**: Real-time traffic integration (Google Maps, LTA DataMall), checkpoint wait time estimation
- **database.py**: SQLite database for historical crossing data and traffic snapshots

### ML Pipeline (`backend/ml/`)

- **train_model.py**: Model training with XGBoost/LightGBM/RandomForest
- **data_loader.py**: Data loading, synthetic data generation, cleaning
- **feature_engineering.py**: Feature creation (time, holidays, mode, weather)

**Feature Engineering Pipeline:**
1. Time features: hour_of_day, day_of_week, is_weekend, is_peak_hour
2. Holiday features: Singapore/Malaysia public & school holidays
3. Mode features: one-hot encoding for car/taxi/bus
4. Weather features: rain_mm, temp_c from OpenWeatherMap
5. Historical features: average travel time for hour/day combination

### Frontend Structure (`frontend/src/`)

- **App.js**: Main application, state management, API integration
- **components/Sidebar.js**: User input form (origin, destination, date, time, mode)
- **components/Map.js**: Leaflet map with route visualization, congestion coloring
- **components/Alerts.js**: Alert notifications for congestion/holidays
- **components/Charts.js**: Historical data visualization with Recharts
- **components/ScenarioAnalysis.js**: Multi-time comparison for optimal planning
- **services/api.js**: Axios API client for backend communication

### Data Flow

1. User submits travel details in Sidebar
2. Frontend calls `/api/v1/predict` with form data
3. Backend engineers features using `utils.engineer_features()`
4. ML model predicts travel time with confidence interval
5. Response includes prediction, congestion level, and alerts
6. Frontend displays results on map, charts, and alerts

## Key Implementation Details

### Holiday Detection

The app checks for:
- **Singapore public holidays**: Using `holidays.Singapore()`
- **Malaysia public holidays**: Using `holidays.Malaysia()`
- **School holidays**: Hardcoded approximate dates (update annually)
  - Singapore: March (8-16), June (27-25), Sep (2-10), Year-end (Nov 18+)
  - Malaysia: March (20-30), Mid-year (May 27-Jun 11), Year-end (Nov 20+)

**Important**: School holiday dates are approximate and should be updated annually based on official calendars.

### Weather Integration

- Uses OpenWeatherMap API for current weather at JB causeway (1.4655, 103.7578)
- Falls back to defaults (0mm rain, 30°C) if API unavailable
- Weather features: `rain_mm`, `temp_c`

### Traffic Patterns

Base travel time: 30 minutes without traffic

Peak multipliers:
- Morning peak (7-9 AM): 2.0-3.0x
- Evening peak (5-7 PM): 2.2-3.2x
- Shoulder hours: 1.5-2.0x
- Weekend: 0.7x reduction
- Rain >5mm: 1.3x increase

### Real-Time Traffic Integration

The app now integrates real-time traffic data from multiple sources:

**Google Maps Distance Matrix API** (`/api/v1/traffic/live`):
- Provides current travel duration with traffic conditions
- Returns traffic multiplier (actual vs. normal duration ratio)
- Automatically stores snapshots in database for analysis
- Used to adjust predictions for same-day travel

**Checkpoint Wait Time Estimation** (`/api/v1/checkpoint/wait-time`):
- Pattern-based estimation using historical data
- Considers time of day, day of week, holidays
- Separate patterns for Woodlands and Tuas checkpoints
- Provides min/max range with confidence level

**Historical Data Collection** (`/api/v1/crossings/*`):
- Users can submit actual crossing times via `/crossings/submit`
- Stores actual travel times, wait times, conditions
- Enables continuous model improvement
- Accessible via `/crossings/recent` and `/stats` endpoints

**Database Schema** (SQLite):
- `crossings` table: Historical crossing records with predictions vs. actuals
- `traffic_snapshots` table: Real-time traffic data snapshots
- Indexed by timestamp and checkpoint for fast queries

The prediction endpoint (`/predict`) automatically incorporates:
- Real-time traffic multiplier for same-day predictions
- Estimated checkpoint wait time based on travel hour
- Historical patterns from database

### Model Loading

Two modes:
- **Local**: `MODEL_PATH=./models/travel_time_model.joblib`
- **GCS**: `USE_GCS=true`, loads from Cloud Storage bucket

The model is loaded at startup in `main.py` lifespan event. If loading fails, API continues with fallback predictions using historical averages.

### API Response Format

Predictions include:
- `predicted_time_minutes`: Point estimate
- `lower_bound_minutes`, `upper_bound_minutes`: 95% confidence interval
- `congestion_level`: "low", "moderate", "high", "severe"
- `alert`: Optional warning message for severe congestion or holidays

Congestion levels based on predicted/base time ratio:
- Low: <1.2x
- Moderate: 1.2-1.5x
- High: 1.5-2.0x
- Severe: >2.0x

## Environment Configuration

### Backend Environment Variables

Critical variables:
- `OPENWEATHER_API_KEY`: For weather data (recommended)
- `GOOGLE_MAPS_API_KEY`: For real-time traffic data from Google Maps Distance Matrix API (required for live traffic)
- `LTA_DATAMALL_API_KEY`: For Singapore LTA traffic cameras and speed bands (optional)
- `USE_GCS`: Set to `true` for Cloud Run deployment
- `GCS_BUCKET_NAME`, `MODEL_BLOB_NAME`: GCS model location

### Frontend Environment Variables

- `REACT_APP_API_URL`: Backend API URL (auto-proxied in dev via package.json)

## Deployment Notes

### Docker Compose (Local Development)

- Backend runs on port 8000
- Frontend runs on port 80
- Shared network for inter-container communication
- Volume mounts for hot reload during development

### Google Cloud Run

- Backend: asia-southeast1, 1GB memory, 1 CPU, max 10 instances
- Frontend: asia-southeast1, 512MB memory, 1 CPU
- Secrets managed via Google Secret Manager
- Model loaded from GCS bucket
- CORS configured for frontend origin

### Health Checks

- Backend: `/health` endpoint returns model load status
- Docker healthcheck: Calls `/health` every 30s

## Testing Strategy

Backend:
- Unit tests for feature engineering functions
- Integration tests for API endpoints
- Model performance validation (MAE, R2)

Frontend:
- Component tests with React Testing Library
- API service mocking
- UI interaction tests

## Common Issues & Solutions

**Issue**: Model not loading
- Check `MODEL_PATH` points to valid .joblib file
- For GCS: Verify bucket permissions and blob name
- Check logs for specific error messages

**Issue**: Weather API failing
- App continues with default values (0mm rain, 30°C)
- Verify `OPENWEATHER_API_KEY` is valid
- Check API quota limits

**Issue**: CORS errors
- Verify `CORS_ORIGINS` includes frontend URL
- For Cloud Run: Update backend CORS to include frontend URL

**Issue**: Predictions seem inaccurate
- Retrain model with actual historical data (currently uses synthetic)
- Update school holiday dates annually
- Verify feature engineering logic matches training

## Data Requirements

For production use, replace synthetic data with real historical data:

**Required CSV columns:**
- `datetime`: Timestamp of travel
- `origin`: "singapore" or "jb"
- `destination`: "jb" or "singapore"
- `mode`: "car", "taxi", or "bus"
- `travel_time_minutes`: Actual measured time
- `rain_mm`: Rainfall in mm (optional, will be filled)
- `temp_c`: Temperature in °C (optional, will be filled)

**Data collection sources:**
- Manual logging during actual crossings
- GPS tracking apps
- Google Maps Timeline API
- LTA traffic cameras and sensors
- Crowd-sourced travel time reports

## Performance Optimization

- Model inference: <100ms typical
- API response time: <500ms including feature engineering
- Frontend bundle: ~500KB gzipped
- Map tiles cached by browser
- Historical data limited to 90 days max

## Security Considerations

- API keys stored in environment variables or Secret Manager
- No sensitive data in frontend code
- CORS restricted to known origins
- Input validation on all API endpoints
- Rate limiting recommended for production (not implemented)
