# CLAUDE.md

This file provides guidance to Claude Code when working with the **SG-JB Link Traffic Intelligence** project.

## Project Overview

**SG-JB Link Traffic Intelligence** is a production-ready web application that predicts travel times between Singapore and Johor Bahru (JB) using machine learning, real-time traffic data, and crowd-sourced intelligence.

**Core Value Proposition:**
- ML-powered travel time predictions with confidence intervals
- Real-time traffic integration from Google Maps Distance Matrix API
- Checkpoint-specific wait time estimation (Woodlands/Tuas)
- Crowd-sourced congestion reporting (Waze-style)
- Smart departure time recommendations
- Historical data collection for continuous improvement

**Tech Stack:**
- **Frontend**: React 18 + Tailwind CSS + Lucide Icons + Recharts
- **Backend**: Python 3.11 + FastAPI + XGBoost/LightGBM
- **Database**: SQLite (historical crossings, traffic snapshots)
- **APIs**: Google Maps (traffic), OpenWeatherMap (weather), LTA DataMall (SG traffic)
- **Deployment**: Docker + Google Cloud Run

---

## Frontend Dashboard Specification

### Role: Senior React Developer & UI/UX Designer

### Objective
Build a single-file, production-ready React dashboard: **"SG-JB Link Traffic Intelligence"**

### Design System
- **Framework**: React 18 (Functional Components + Hooks)
- **Styling**: Tailwind CSS (slate/blue color palette)
- **Icons**: lucide-react
- **Charts**: recharts (ResponsiveContainer, AreaChart, LineChart)
- **Responsive**: Mobile-first design

### Core Features

#### 1. Mock Data Logic
**Function**: `generateHourlyTrend(checkpoint, isWeekend, mode)`

**Traffic Patterns:**
- Morning Peak: 7-10am (congestion multiplier: 2.0-3.0x)
- Evening Peak: 5-9pm (congestion multiplier: 2.2-3.2x)
- Late Night: 11pm-5am (congestion multiplier: 0.5-0.7x)
- Weekend: +20% slower overall
- Bus Mode: 1.4x longer than Car

**Return Format:**
```javascript
[
  {
    hour: 0,
    time: 35, // minutes
    average: 30, // historical average
    congestion: "Low" | "Medium" | "High"
  },
  // ... 24 data points
]
```

#### 2. Layout Structure

**A. Sticky Header**
- App title: "SG-JB Link Traffic Intelligence"
- Status indicators:
  - Woodlands Causeway (🌉 with congestion color)
  - Tuas Second Link (🌁 with congestion color)
- Last Synced timestamp (e.g., "Last synced: 2 mins ago")

**B. Left Sidebar (350px fixed)**

**Trip Planner:**
```
Origin: [Dropdown: Singapore | Johor Bahru]
Destination: [Dropdown: Johor Bahru | Singapore]
Date: [Date Picker]
Time: [Time Picker]
```

**Route Toggle:**
```
[🌉 Woodlands Causeway]  [🌁 Tuas Second Link]
     ~45 min                  ~38 min
```
- Show current travel time estimate on buttons
- Highlight selected route

**Mode Toggle:**
```
[🚗 Car]  [🚌 Public Bus]
```

**Smart Recommendation Card:**
```
💡 Smart Tip
Depart 2 hours earlier (4:00 PM) to save 25 minutes
```
- Only show if significant savings found (>15 min) within ±3 hours
- Show recommended time and time saved

**Crowd Reporting (Waze-style):**
```
Immigration Hall Status
[✅ Clear] [⚠️ Busy] [🔴 Packed]

🙋 Current sentiment: 42% Clear, 35% Busy, 23% Packed
```
- Allow users to vote once
- Show aggregated percentages in real-time
- Prevent double voting (use localStorage)

**C. Main Dashboard (Right - Flex 1)**

**Stat Cards (4-card grid):**
1. **Predicted Duration**
   - Value: "45 min"
   - Subtext: "Range: 38-52 min"
   - Icon: 🕐 (red background)

2. **Congestion Level**
   - Value: Badge with color (Low=Green, Medium=Amber, High=Red)
   - Subtext: "Based on historical data"
   - Icon: 🚙 (blue background)

3. **Weather**
   - Value: "31°C"
   - Subtext: "Clear"
   - Icon: ☀️ (purple background)

4. **Traffic Pattern**
   - Value: "Weekday Peak"
   - Subtext: "Historical avg: 35 min"
   - Icon: 📊

**Crowd Sentiment Bar:**
```
[████████░░░░] 42% Clear
[███████░░░░░] 35% Busy
[█████░░░░░░░] 23% Packed
```

**Tabbed Visualizations:**

**Tab 1: Forecast**
- **Schematic Map (Custom SVG)**:
  ```
  ┌─────────────────┐
  │  JOHOR BAHRU    │
  │      (MY)       │
  └─────────────────┘
         │   │
    🌉 Woodlands (Green)
    🌁 Tuas (Amber)
         │   │
  ┌─────────────────┐
  │   SINGAPORE     │
  │      (SG)       │
  └─────────────────┘
  ```
  - Abstract land masses as rounded rectangles
  - Show both links with congestion colors
  - Highlight selected route
  - Add traffic flow indicators

- **24-Hour Trend Chart (AreaChart)**:
  - X-axis: Hours (0-23)
  - Y-axis: Travel Time (minutes)
  - Line 1: Predicted (blue area fill)
  - Line 2: Historical Average (dashed gray)
  - Current time marker (vertical line)
  - Tooltips on hover

**Tab 2: Live Cameras**
- Grid of 6 mock "Traffic Camera" feeds
- Each card shows:
  - Camera name: "Woodlands Checkpoint - Lane 1"
  - Placeholder image with scanline effect
  - Timestamp: "Updated: 2 mins ago"
  - Status indicator: "🟢 Live"

#### 3. Interactive Behavior

**State Management:**
```javascript
const [route, setRoute] = useState('woodlands');
const [mode, setMode] = useState('car');
const [origin, setOrigin] = useState('singapore');
const [destination, setDestination] = useState('jb');
const [travelDate, setTravelDate] = useState(new Date());
const [travelTime, setTravelTime] = useState('18:00');
const [loading, setLoading] = useState(false);
const [prediction, setPrediction] = useState(null);
const [crowdVotes, setCrowdVotes] = useState({ clear: 0, busy: 0, packed: 0 });
const [userVoted, setUserVoted] = useState(false);
```

**useEffect Dependencies:**
- Recalculate traffic when: route, date, time, mode, origin, or destination changes
- Show loading spinner during calculation
- Fetch fresh data from API

**API Integration:**
```javascript
// Fetch prediction
const fetchPrediction = async () => {
  setLoading(true);
  const response = await fetch('/api/v1/predict', {
    method: 'POST',
    body: JSON.stringify({
      origin,
      destination,
      travel_date: travelDate,
      travel_time: travelTime,
      mode,
      checkpoint: route
    })
  });
  setPrediction(await response.json());
  setLoading(false);
};
```

#### 4. UI/UX Details

**Color Coding:**
- Low Congestion: `bg-green-100 text-green-800 border-green-500`
- Medium Congestion: `bg-yellow-100 text-yellow-800 border-yellow-500`
- High Congestion: `bg-red-100 text-red-800 border-red-500`
- Severe Congestion: `bg-red-200 text-red-900 border-red-600`

**Loading States:**
```javascript
{loading && (
  <div className="flex items-center gap-2">
    <Loader2 className="animate-spin" />
    <span>Calculating traffic...</span>
  </div>
)}
```

**Responsive Breakpoints:**
- Mobile (<768px): Sidebar below header, single column
- Tablet (768-1024px): Sidebar left, main right (flexible)
- Desktop (>1024px): Sidebar 350px fixed, main flex

**Tooltips:**
- Chart tooltips show: Hour, Predicted Time, Historical Average
- Info icons (ℹ️) on stat cards explain metrics

**Animation:**
- Fade in predictions when loaded
- Smooth color transitions on congestion changes
- Chart animations on mount

---

## Backend Architecture

### Directory Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, lifespan
│   ├── routes.py            # API endpoints
│   ├── model.py             # ML model management
│   ├── utils.py             # Feature engineering, APIs
│   ├── config.py            # Settings, env vars
│   ├── traffic_apis.py      # Google Maps, LTA, wait time
│   └── database.py          # SQLite DB for crossings
├── ml/
│   ├── train_model.py       # Model training
│   ├── data_loader.py       # Data loading, generation
│   └── feature_engineering.py
├── data/
│   └── crossings.db         # SQLite database
└── models/
    └── travel_time_model.joblib
```

### API Endpoints

#### Prediction
**POST** `/api/v1/predict`
```json
{
  "origin": "singapore",
  "destination": "jb",
  "travel_date": "2025-12-24",
  "travel_time": "18:00",
  "mode": "car",
  "checkpoint": "woodlands"
}
```

**Response:**
```json
{
  "predicted_time_minutes": 75.5,
  "lower_bound_minutes": 65.2,
  "upper_bound_minutes": 85.8,
  "congestion_level": "high",
  "features_used": {...},
  "alert": "⚠️ Heavy traffic during peak hours"
}
```

#### Real-Time Traffic
**GET** `/api/v1/traffic/live?origin=singapore&destination=jb&checkpoint=woodlands`

**Response:**
```json
{
  "duration_minutes": 25.2,
  "duration_in_traffic_minutes": 59.18,
  "traffic_multiplier": 2.35,
  "distance_km": 14.546,
  "timestamp": "2025-12-24T06:50:21",
  "checkpoint": "woodlands",
  "direction": "singapore_to_jb"
}
```

#### Checkpoint Wait Time
**GET** `/api/v1/checkpoint/wait-time?checkpoint=woodlands&origin=singapore&destination=jb`

**Response:**
```json
{
  "estimated_wait_minutes": 35.0,
  "min_wait_minutes": 24.5,
  "max_wait_minutes": 45.5,
  "confidence": "medium",
  "checkpoint": "woodlands",
  "direction": "singapore_to_jb"
}
```

#### Submit Crossing Data
**POST** `/api/v1/crossings/submit`
```json
{
  "checkpoint": "woodlands",
  "origin": "singapore",
  "destination": "jb",
  "mode": "car",
  "actual_travel_time_minutes": 65.5,
  "actual_wait_time_minutes": 25.0,
  "weather_condition": "clear"
}
```

#### Database Statistics
**GET** `/api/v1/stats`

**Response:**
```json
{
  "total_crossings": 150,
  "total_traffic_snapshots": 500,
  "earliest_crossing": "2025-11-01T06:00:00",
  "latest_crossing": "2025-12-24T18:30:00"
}
```

---

## ML Model Training

### Feature Engineering

**Time-based (8 features):**
- hour_of_day, minute_of_hour, day_of_week, day_of_month, month
- is_weekend, is_morning_peak, is_evening_peak

**Holiday-based (5 features):**
- is_sg_holiday, is_my_holiday
- is_sg_school_holiday, is_my_school_holiday
- is_any_holiday

**Route-based (2 features):**
- direction_sg_to_jb (1=SG→JB, 0=JB→SG)
- checkpoint (woodlands=0, tuas=1)

**Mode-based (3 features):**
- mode_car, mode_taxi, mode_bus (one-hot encoded)

**Weather-based (2 features):**
- rain_mm (rainfall in millimeters)
- temp_c (temperature in Celsius)

**Historical (1 feature):**
- historical_avg_time (average for similar hour/day)

**Real-time (2 features):**
- realtime_traffic_multiplier (from Google Maps)
- estimated_wait_time (checkpoint wait time)

**Total: 23 features**

### Training Pipeline

```bash
# Generate synthetic data (10,000 samples)
python -m ml.data_loader --output data/synthetic_crossings.csv

# Train XGBoost model
python -m ml.train_model --model xgboost --data data/synthetic_crossings.csv

# Evaluate model
# Expected performance: R² = 0.91+, MAE = 4.7 min, RMSE = 6.1 min
```

### Model Files
- **travel_time_model.joblib**: Trained XGBoost model
- **feature_importance.png**: Feature importance visualization

---

## Real-Time Features

### Live Traffic Integration
- **Google Maps Distance Matrix API**: Provides current traffic conditions
- **Traffic Multiplier**: Adjusts predictions for same-day travel
- **Automatic Storage**: Traffic snapshots stored in database
- **Fallback**: Historical patterns when API unavailable

### Checkpoint Wait Times
- **Pattern-based Estimation**: Uses hour/day/checkpoint data
- **Separate Models**: Woodlands and Tuas have different patterns
- **Weekday vs Weekend**: Different multipliers
- **Holiday Adjustments**: 1.5x multiplier during holidays
- **Confidence Ranges**: Min/max wait times provided

**Example Wait Time Patterns:**
```python
WOODLANDS_WEEKDAY_SG_TO_JB = {
    6: 15, 7: 25, 8: 35, 9: 20,  # Morning rush
    17: 30, 18: 40, 19: 35,      # Evening rush
    0: 5, 1: 5, 2: 5             # Late night
}
```

### Historical Data Collection
- **User Submissions**: Via `/crossings/submit` endpoint
- **SQLite Database**: Tables for crossings and traffic snapshots
- **Indexed Queries**: Fast retrieval by timestamp and checkpoint
- **Continuous Learning**: Actual data improves future predictions

---

## Development Workflow

### Setup

```bash
# Backend
cd backend
conda env create -f environment.yml
conda activate sg-jb-backend
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

### Testing

```bash
# Backend tests
pytest

# Test endpoints
curl "http://localhost:8000/api/v1/traffic/live?origin=singapore&destination=jb"
curl "http://localhost:8000/api/v1/checkpoint/wait-time?checkpoint=woodlands"
curl http://localhost:8000/api/v1/stats

# Frontend tests
npm test
```

### Environment Variables

**Backend (.env):**
```
GOOGLE_MAPS_API_KEY=your-key          # Required for real-time traffic
LTA_DATAMALL_API_KEY=your-key         # Optional for SG traffic
OPENWEATHER_API_KEY=your-key          # Recommended for weather
MODEL_PATH=./models/travel_time_model.joblib
USE_GCS=false
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:8000
```

---

## Deployment

### Docker Compose (Local)

```bash
docker-compose up --build
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Upload model to GCS
gsutil cp backend/models/travel_time_model.joblib gs://sg-jb-ml-models/

# Set environment variables
gcloud run services update sg-jb-backend \
  --set-env-vars="USE_GCS=true,GCS_BUCKET_NAME=sg-jb-ml-models"
```

---

## Data Schema

### Database: `crossings.db`

**Table: `crossings`**
```sql
CREATE TABLE crossings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    checkpoint TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    mode TEXT NOT NULL,
    travel_time_minutes REAL NOT NULL,
    wait_time_minutes REAL,
    total_time_minutes REAL NOT NULL,
    weather_condition TEXT,
    temperature_c REAL,
    is_holiday BOOLEAN,
    day_of_week INTEGER,
    hour_of_day INTEGER,
    congestion_level TEXT,
    predicted_time_minutes REAL,
    prediction_error_minutes REAL
);
```

**Table: `traffic_snapshots`**
```sql
CREATE TABLE traffic_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    checkpoint TEXT NOT NULL,
    direction TEXT NOT NULL,
    traffic_duration_minutes REAL NOT NULL,
    wait_time_minutes REAL,
    congestion_multiplier REAL,
    source TEXT NOT NULL,
    raw_data TEXT
);
```

---

## Common Issues & Solutions

### Issue: Model not loading
**Solution:**
- Check `MODEL_PATH` points to valid .joblib file
- For GCS: Verify bucket permissions and blob name
- Check logs for specific error messages

### Issue: Weather API failing
**Solution:**
- App continues with default values (0mm rain, 30°C)
- Verify `OPENWEATHER_API_KEY` is valid
- Check API quota limits

### Issue: CORS errors
**Solution:**
- Verify `CORS_ORIGINS` includes frontend URL
- For Cloud Run: Update backend CORS to include frontend URL

### Issue: Real-time traffic not working
**Solution:**
- Verify `GOOGLE_MAPS_API_KEY` is configured
- Check API key has Distance Matrix API enabled
- Verify billing is enabled on Google Cloud project
- Check rate limits

### Issue: Predictions seem inaccurate
**Solution:**
- Retrain model with actual historical data (currently synthetic)
- Update school holiday dates annually
- Verify feature engineering logic matches training
- Collect more crossing submissions via `/crossings/submit`

---

## Performance Metrics

**Backend:**
- Model inference: <100ms
- API response time: <500ms (including feature engineering)
- Database queries: <50ms (with indexes)

**Frontend:**
- Bundle size: ~500KB gzipped
- First contentful paint: <1.5s
- Time to interactive: <2.5s
- Chart render: <200ms

**ML Model:**
- R² Score: 0.915 (91.5% variance explained)
- MAE: 4.72 minutes
- RMSE: 6.14 minutes
- Training time: ~30 seconds (10K samples)

---

## Future Enhancements

- [x] ✅ Real-time traffic integration
- [x] ✅ Historical data from actual crossings
- [x] ✅ Border checkpoint wait times
- [x] ✅ Checkpoint switching (Woodlands/Tuas)
- [ ] Push notifications for congestion alerts
- [ ] Mobile apps (iOS/Android)
- [ ] Integration with taxi/ride-sharing APIs
- [ ] Multi-route optimization
- [ ] Parking availability at checkpoints
- [ ] Live traffic camera feeds
- [ ] Crowd-sourced real-time updates (Waze-style)
- [ ] Smart departure time recommendations
- [ ] Immigration hall status reporting

---

## License

MIT License

## Support

- GitHub Issues: https://github.com/azniosman/sg-jb/issues
- Email: az@azni.me
