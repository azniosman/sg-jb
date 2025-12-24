"""
Configuration management using Pydantic settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    environment: str = "development"

    # Google Cloud
    gcp_project_id: str = ""
    gcs_bucket_name: str = "sg-jb-ml-models"
    model_blob_name: str = "travel_time_model.joblib"

    # External APIs
    openweather_api_key: str = ""
    google_maps_api_key: str = ""
    lta_datamall_api_key: str = ""

    # Model Configuration
    model_path: str = "./models/travel_time_model.joblib"
    use_gcs: bool = False

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Logging
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
