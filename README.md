# 🚗 Singapore-JB Travel Time Predictor

A web application that predicts travel times between Singapore and Johor Bahru (JB) using machine learning, with special focus on congestion during school holidays and festive periods.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![Python](https://img.shields.io/badge/Python-3.11-yellow)
![License](https://img.shields.io/badge/License-MIT-purple)

## ✨ Features

### Core Functionality
- **🤖 ML-Powered Predictions**: XGBoost/LightGBM models for accurate travel time forecasts
- **📅 Holiday Awareness**: Accounts for Singapore & Malaysia public and school holidays
- **🌦️ Weather Integration**: Real-time weather data from OpenWeatherMap API
- **🚦 Real-Time Traffic**: Live traffic data from Google Maps Distance Matrix API
- **⏱️ Checkpoint Wait Times**: Pattern-based estimation for Woodlands and Tuas checkpoints
- **💾 Historical Data Collection**: User-contributed actual crossing times for continuous improvement
- **🗺️ Interactive Map**: Visual route display with congestion-based coloring
- **📊 24-Hour Forecast**: Charts showing predicted travel times throughout the day
- **💡 Smart Recommendations**: AI-powered suggestions for optimal departure times
- **⚠️ Congestion Alerts**: Real-time notifications for peak traffic periods
- **🙋 Crowd-Sourced Status**: Waze-style immigration hall status reporting
- **📹 Live Cameras**: Mock camera feeds for checkpoint monitoring (demo)

### Modern UI/UX Design
- **🎨 Professional Design System**: Built with Tailwind CSS and modern design principles
- **✨ Glassmorphism Effects**: Frosted glass backdrop blur on header and overlays
- **🌈 Gradient Aesthetics**: Beautiful color gradients throughout the interface
- **💫 Smooth Animations**: Fade-in, slide-up, scale, and pulse effects
- **🎯 Bold Typography**: Clear visual hierarchy with font-black weights
- **🔦 Glow Effects**: Interactive elements with hover glow and shadow transitions
- **📐 Modern Shadows**: Multi-level depth (soft, medium, hard) for professional look
- **🖱️ Micro-Interactions**: Scale transforms, color transitions, and hover effects
- **📱 Fully Responsive**: Mobile-first design that works on all screen sizes
- **☁️ Cloud Ready**: Containerized deployment to Google Cloud Run

## 🏗️ Architecture

```
sg-jb/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── routes.py        # API endpoints
│   │   ├── model.py         # ML model management
│   │   ├── utils.py         # Feature engineering & APIs
│   │   ├── config.py        # Configuration
│   │   ├── traffic_apis.py  # Real-time traffic integration
│   │   └── database.py      # SQLite database for crossings
│   ├── ml/
│   │   ├── train_model.py   # Model training script
│   │   ├── data_loader.py   # Data loading utilities
│   │   └── feature_engineering.py
│   ├── data/                # SQLite database storage
│   └── Dockerfile
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API service
│   │   └── App.js
│   └── Dockerfile
├── docker-compose.yml        # Local development
└── cloudbuild.yaml          # Cloud deployment
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for easiest setup)
- OR **Node.js 18+** and **Python 3.11+**
- API Keys (optional but recommended):
  - OpenWeatherMap API key
  - Google Maps API key

### Option 1: Docker Compose (Recommended)
 
1. **Clone the repository**
   ```bash
   git clone https://github.com/azniosman/sg-jb.git
   cd sg-jb
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your API keys

   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Train the ML model**
   ```bash
   cd backend
   python -m ml.train_model --model xgboost --output models/travel_time_model.joblib
   cd ..
   ```

4. **Start the application**
   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create conda environment (recommended)
conda env create -f environment.yml
conda activate sg-jb-backend

# OR use virtual environment
# python -m venv venv
# source venv/bin/activate  # On Windows: venv\Scripts\activate
# pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Train model
python -m ml.train_model --model xgboost

# Run the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env if needed

# Start development server
npm start
```

## 📚 API Documentation

### Endpoints

#### `POST /api/v1/predict`

Predict travel time for a single journey.

**Request Body:**
```json
{
  "origin": "singapore",
  "destination": "jb",
  "travel_date": "2024-12-25",
  "travel_time": "08:00",
  "mode": "car"
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
  "alert": "⚠️ Heavy traffic during peak hours. Plan extra time."
}
```

#### `POST /api/v1/simulate`

Simulate multiple scenarios to compare different times.

**Request Body:**
```json
{
  "scenarios": [
    {
      "origin": "singapore",
      "destination": "jb",
      "travel_date": "2024-12-25",
      "travel_time": "06:00",
      "mode": "car"
    },
    {
      "origin": "singapore",
      "destination": "jb",
      "travel_date": "2024-12-25",
      "travel_time": "08:00",
      "mode": "car"
    }
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "date": "2024-12-25",
      "time": "06:00",
      "predicted_time": 45.2,
      "congestion_level": "moderate"
    },
    ...
  ]
}
```

#### `GET /api/v1/historical`

Get historical travel time data.

**Query Parameters:**
- `days`: Number of days (default: 30, max: 90)
- `origin`: Origin location (default: "singapore")
- `destination`: Destination location (default: "jb")

**Response:**
```json
[
  {
    "date": "2024-11-25",
    "hour": 8,
    "avg_travel_time": 68.5,
    "congestion_level": "high"
  },
  ...
]
```

#### `GET /api/v1/traffic/live`

Get real-time traffic data from Google Maps.

**Query Parameters:**
- `origin`: Origin location (default: "singapore")
- `destination`: Destination location (default: "jb")
- `checkpoint`: Checkpoint to use (default: "woodlands")

**Response:**
```json
{
  "duration_minutes": 25.2,
  "duration_in_traffic_minutes": 59.18,
  "traffic_multiplier": 2.35,
  "distance_km": 14.546,
  "timestamp": "2025-12-24T06:50:21.175285",
  "checkpoint": "woodlands",
  "direction": "singapore_to_jb"
}
```

#### `GET /api/v1/checkpoint/wait-time`

Get estimated checkpoint wait time.

**Query Parameters:**
- `checkpoint`: Checkpoint name (default: "woodlands")
- `origin`: Origin location (default: "singapore")
- `destination`: Destination location (default: "jb")
- `travel_datetime`: Travel datetime (optional, defaults to now)

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

#### `POST /api/v1/crossings/submit`

Submit actual crossing data to improve predictions.

**Request Body:**
```json
{
  "checkpoint": "woodlands",
  "origin": "singapore",
  "destination": "jb",
  "mode": "car",
  "actual_travel_time_minutes": 65.5,
  "actual_wait_time_minutes": 25.0,
  "weather_condition": "clear",
  "notes": "Light traffic today"
}
```

**Response:**
```json
{
  "status": "success",
  "crossing_id": 42,
  "message": "Thank you for contributing data to improve predictions!"
}
```

#### `GET /api/v1/crossings/recent`

Get recent crossing submissions.

**Query Parameters:**
- `checkpoint`: Filter by checkpoint (optional)
- `hours`: Hours of history (default: 24)
- `limit`: Maximum records (default: 100)

**Response:**
```json
{
  "count": 15,
  "crossings": [
    {
      "id": 42,
      "timestamp": "2025-12-24T08:30:00",
      "checkpoint": "woodlands",
      "travel_time_minutes": 65.5,
      "wait_time_minutes": 25.0,
      "congestion_level": "moderate"
    },
    ...
  ]
}
```

#### `GET /api/v1/stats`

Get database statistics.

**Response:**
```json
{
  "total_crossings": 150,
  "total_traffic_snapshots": 500,
  "earliest_crossing": "2025-11-01T06:00:00",
  "latest_crossing": "2025-12-24T18:30:00"
}
```

## 🎨 Frontend Design System

The application features a modern, professional UI built with React 18 and Tailwind CSS.

### Design Tokens

**Custom Shadows:**
- `shadow-soft`: Subtle elevation for cards
- `shadow-medium`: Standard card depth
- `shadow-hard`: Prominent elevation for modals
- `shadow-glow`: Blue glow effect for interactive elements
- `shadow-inner-soft`: Inset shadow for inputs

**Gradient Backgrounds:**
- `gradient-info`: Blue gradient (primary actions)
- `gradient-success`: Green gradient (success states)
- `gradient-warning`: Orange gradient (warnings)
- `gradient-danger`: Red gradient (alerts)
- `gradient-glass`: Transparent glass effect

**Animations:**
- `animate-fade-in`: Smooth fade-in effect
- `animate-slide-up`: Slide up from bottom
- `animate-slide-down`: Slide down from top
- `animate-scale-in`: Scale up animation
- `animate-pulse-soft`: Gentle pulsing effect
- `animate-shimmer`: Shimmer loading effect

### Component Styling

**Cards:**
- Rounded corners (2xl: 1.5rem)
- Gradient backgrounds
- Hover scale transformations
- Smooth shadow transitions

**Buttons:**
- Gradient backgrounds for active states
- Scale animations on hover (scale-105)
- Bold typography (font-black)
- Icon + text combinations

**Form Inputs:**
- Soft background (slate-50)
- Focus ring with primary color
- Rounded corners (xl: 1rem)
- Smooth transitions

**Interactive Elements:**
- 300ms transition duration
- Hover glow effects
- Color transformations
- Scale feedback

### Color Palette

**Primary Blue:**
- 50-900 scale from light to dark
- Used for: buttons, links, accents

**Status Colors:**
- Green: Low congestion, success states
- Yellow: Moderate congestion, warnings
- Orange: High congestion, cautions
- Red: Severe congestion, errors

**Neutral Grays:**
- Slate scale (50-900)
- Used for: text, backgrounds, borders

### Typography

**Font Weights:**
- `font-medium` (500): Body text
- `font-bold` (700): Emphasis
- `font-black` (900): Headings, important data

**Text Sizes:**
- `text-xs` (0.75rem): Timestamps, labels
- `text-sm` (0.875rem): Body text
- `text-lg` (1.125rem): Subheadings
- `text-2xl` (1.5rem): Main headings
- `text-3xl` (1.875rem): Hero text

**Custom Features:**
- Gradient text backgrounds
- Uppercase tracking for labels
- Line height optimization

### Accessibility

- WCAG 2.1 AA compliant color contrasts
- Focus states on all interactive elements
- Smooth scroll behavior
- Keyboard navigation support
- Custom scrollbar styling

## 🧠 ML Model Training

### Training the Model

```bash
cd backend

# Train with default settings (XGBoost)
python -m ml.train_model

# Train with specific model type
python -m ml.train_model --model lightgbm

# Train with custom data
python -m ml.train_model --data /path/to/data.csv --model xgboost

# Specify output path
python -m ml.train_model --output custom_model.joblib
```

### Model Features

The model uses these engineered features:

- **Time-based**: hour_of_day, day_of_week, is_weekend, is_peak_hour
- **Holidays**: Singapore & Malaysia public holidays, school holidays
- **Direction**: Singapore to JB or vice versa
- **Mode**: car, taxi, or bus
- **Weather**: rainfall (mm), temperature (°C)
- **Real-time traffic**: traffic multiplier from Google Maps (for same-day predictions)
- **Wait times**: checkpoint wait time based on historical patterns
- **Historical**: average travel time for similar conditions

### Real-Time Features

**Live Traffic Integration:**
- Google Maps Distance Matrix API provides current traffic conditions
- Traffic multiplier adjusts predictions for same-day travel
- Automatic storage of traffic snapshots for analysis
- Fallback to historical patterns when API unavailable

**Checkpoint Wait Times:**
- Pattern-based estimation using hour/day/checkpoint data
- Separate models for Woodlands and Tuas checkpoints
- Weekday vs. weekend patterns
- Holiday multipliers (1.5x during holidays)
- Confidence ranges (min/max wait times)

**Historical Data Collection:**
- User submissions stored in SQLite database
- Tables: `crossings` and `traffic_snapshots`
- Indexed by timestamp and checkpoint for fast queries
- Database location: `backend/data/crossings.db`
- API endpoints for submitting and retrieving crossing data

### Data Format

If you have real historical data, format it as CSV with these columns:

```csv
datetime,origin,destination,mode,travel_time_minutes,rain_mm,temp_c
2024-01-15 08:30:00,singapore,jb,car,75.5,0,28.5
2024-01-15 17:45:00,jb,singapore,car,82.3,2.5,30.2
...
```

## 🌐 Deployment to Google Cloud Run

### Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally

### Setup

1. **Configure GCP project**
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   gcloud auth configure-docker
   ```

2. **Create secrets for API keys**
   ```bash
   echo -n "your-openweather-key" | gcloud secrets create openweather-api-key --data-file=-
   echo -n "your-google-maps-key" | gcloud secrets create google-maps-api-key --data-file=-
   ```

3. **Upload trained model to Cloud Storage**
   ```bash
   gsutil mb gs://sg-jb-ml-models
   gsutil cp backend/models/travel_time_model.joblib gs://sg-jb-ml-models/
   ```

4. **Deploy using the script**
   ```bash
   # Edit deploy-cloud-run.sh with your project ID
   ./deploy-cloud-run.sh
   ```

   Or use Cloud Build:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### Cost Optimization

- Cloud Run bills only for actual usage
- Expected costs: ~$5-20/month for moderate traffic
- Set max instances to control costs:
  ```bash
  gcloud run services update sg-jb-backend --max-instances 10
  ```

## 🔧 Configuration

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_HOST` | Host to bind to | No (default: 0.0.0.0) |
| `API_PORT` | Port to listen on | No (default: 8000) |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key | Recommended |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for live traffic | **Required for real-time features** |
| `LTA_DATAMALL_API_KEY` | LTA DataMall API key for SG traffic | Optional |
| `USE_GCS` | Load model from GCS | No (default: false) |
| `GCS_BUCKET_NAME` | GCS bucket name | If USE_GCS=true |
| `MODEL_BLOB_NAME` | Model file name in GCS | If USE_GCS=true |
| `CORS_ORIGINS` | Allowed CORS origins | No (default: localhost) |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API URL | Yes |

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📊 Monitoring & Logging

The application includes:

- Structured JSON logging
- Health check endpoints
- Request/response logging
- Error tracking

For production, integrate with:
- Google Cloud Logging
- Google Cloud Monitoring
- Error Reporting services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Holiday data: Singapore MOM, Malaysia Government
- Weather data: OpenWeatherMap API
- Traffic data: Google Maps API, LTA DataMall
- Maps: OpenStreetMap, Leaflet

## 📧 Support

For issues and questions:
- Create an issue on GitHub
- Email: [az@azni.me](mailto:az@azni.me)


## 🔮 Future Enhancements

- [x] ✅ Real-time traffic integration
- [x] ✅ Historical data from actual crossings
- [x] ✅ Border checkpoint wait times
- [x] ✅ Modern UI/UX with glassmorphism and animations
- [x] ✅ Smart departure time recommendations
- [x] ✅ Crowd-sourced immigration status reporting
- [x] ✅ 24-hour traffic forecast charts
- [ ] Push notifications for congestion alerts
- [ ] Mobile apps (iOS/Android)
- [ ] Integration with taxi/ride-sharing APIs
- [ ] Multi-route optimization
- [ ] Parking availability at checkpoints
- [ ] Real live traffic camera feeds (currently mock)
