# 🚗 Singapore-JB Travel Time Predictor

A web application that predicts travel times between Singapore and Johor Bahru (JB) using machine learning, with special focus on congestion during school holidays and festive periods.

![Tech Stack](https://img.shields.io/badge/React-18.2-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![Python](https://img.shields.io/badge/Python-3.11-yellow)
![License](https://img.shields.io/badge/License-MIT-purple)

## ✨ Features

- **🤖 ML-Powered Predictions**: XGBoost/LightGBM models for accurate travel time forecasts
- **📅 Holiday Awareness**: Accounts for Singapore & Malaysia public and school holidays
- **🌦️ Weather Integration**: Real-time weather data from OpenWeatherMap API
- **🗺️ Interactive Map**: Visual route display with congestion-based coloring
- **📊 Historical Analytics**: Charts showing travel time trends over time
- **🔄 Scenario Analysis**: Compare multiple departure times to find optimal travel windows
- **⚠️ Smart Alerts**: Notifications for peak congestion periods
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
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
│   │   └── config.py        # Configuration
│   ├── ml/
│   │   ├── train_model.py   # Model training script
│   │   ├── data_loader.py   # Data loading utilities
│   │   └── feature_engineering.py
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

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

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
- **Historical**: average travel time for similar conditions

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
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Optional |
| `LTA_DATAMALL_API_KEY` | LTA DataMall API key | Optional |
| `USE_GCS` | Load model from GCS | No (default: false) |
| `GCS_BUCKET_NAME` | GCS bucket name | If USE_GCS=true |
| `MODEL_BLOB_NAME` | Model file name in GCS | If USE_GCS=true |

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

- [ ] Real-time traffic integration
- [ ] Push notifications for congestion alerts
- [ ] Mobile apps (iOS/Android)
- [ ] Historical data from actual crossings
- [ ] Integration with taxi/ride-sharing APIs
- [ ] Multi-route optimization
- [ ] Border checkpoint wait times
- [ ] Parking availability at checkpoints
