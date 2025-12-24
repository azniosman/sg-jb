"""
Main FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from .config import settings
from .routes import router
from .model import initialize_model

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events - startup and shutdown"""
    # Startup
    logger.info("Starting Singapore-JB Travel Time Prediction API")
    logger.info(f"Environment: {settings.environment}")

    # Initialize ML model
    try:
        initialize_model()
    except Exception as e:
        logger.error(f"Failed to initialize model: {e}")
        logger.warning("API will continue without ML model")

    yield

    # Shutdown
    logger.info("Shutting down API")


# Create FastAPI app
app = FastAPI(
    title="Singapore-JB Travel Time Prediction API",
    description="Predict travel times between Singapore and Johor Bahru with congestion analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api/v1", tags=["predictions"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Singapore-JB Travel Time Prediction API",
        "version": "1.0.0",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.environment == "development"
    )
