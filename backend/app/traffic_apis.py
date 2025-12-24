"""
Real-time traffic integration with Google Maps and LTA DataMall
"""
import requests
import logging
from typing import Dict, Optional, Tuple
from datetime import datetime
from .config import settings

logger = logging.getLogger(__name__)


class GoogleMapsTrafficAPI:
    """Integration with Google Maps Distance Matrix API for real-time traffic"""

    BASE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"

    # Key locations
    LOCATIONS = {
        'singapore_woodlands': '1.4437,103.7854',  # Woodlands Checkpoint
        'singapore_tuas': '1.3480,103.6369',       # Tuas Checkpoint
        'jb_woodlands': '1.4655,103.7578',         # JB side of Causeway
        'jb_tuas': '1.3539,103.6360',              # JB side of Second Link
    }

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.google_maps_api_key

    def get_live_travel_time(
        self,
        origin: str,
        destination: str,
        checkpoint: str = 'woodlands'
    ) -> Optional[Dict]:
        """
        Get real-time travel time from Google Maps

        Args:
            origin: 'singapore' or 'jb'
            destination: 'singapore' or 'jb'
            checkpoint: 'woodlands' or 'tuas'

        Returns:
            Dict with duration, duration_in_traffic, distance
        """
        if not self.api_key:
            logger.warning("Google Maps API key not configured")
            return None

        try:
            # Determine origin and destination coordinates
            if origin.lower() == 'singapore':
                origin_coords = self.LOCATIONS[f'singapore_{checkpoint}']
                dest_coords = self.LOCATIONS[f'jb_{checkpoint}']
            else:
                origin_coords = self.LOCATIONS[f'jb_{checkpoint}']
                dest_coords = self.LOCATIONS[f'singapore_{checkpoint}']

            params = {
                'origins': origin_coords,
                'destinations': dest_coords,
                'departure_time': 'now',
                'traffic_model': 'best_guess',
                'key': self.api_key
            }

            response = requests.get(self.BASE_URL, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data['status'] != 'OK':
                logger.error(f"Google Maps API error: {data['status']}")
                return None

            element = data['rows'][0]['elements'][0]

            if element['status'] != 'OK':
                logger.error(f"Route not found: {element['status']}")
                return None

            return {
                'distance_meters': element['distance']['value'],
                'distance_text': element['distance']['text'],
                'duration_seconds': element['duration']['value'],
                'duration_minutes': element['duration']['value'] / 60,
                'duration_in_traffic_seconds': element.get('duration_in_traffic', {}).get('value'),
                'duration_in_traffic_minutes': element.get('duration_in_traffic', {}).get('value', 0) / 60,
                'traffic_multiplier': (
                    element.get('duration_in_traffic', {}).get('value', element['duration']['value'])
                    / element['duration']['value']
                ),
                'timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error fetching Google Maps data: {e}")
            return None


class LTADataMallAPI:
    """Integration with LTA DataMall for Singapore traffic data"""

    BASE_URL = "http://datamall2.mytransport.sg/ltaodataservice"

    # Traffic cameras near checkpoints
    CHECKPOINT_CAMERAS = {
        'woodlands': ['2701', '2702', '2703', '2704', '2705'],  # Woodlands cameras
        'tuas': ['4703', '4704', '4705', '4706', '4707', '4708']  # Tuas cameras
    }

    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.lta_datamall_api_key
        self.headers = {'AccountKey': self.api_key} if self.api_key else {}

    def get_traffic_images(self, checkpoint: str = 'woodlands') -> Optional[list]:
        """Get traffic camera images near checkpoint"""
        if not self.api_key:
            logger.warning("LTA DataMall API key not configured")
            return None

        try:
            response = requests.get(
                f"{self.BASE_URL}/Traffic-Imagesv2",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            camera_ids = self.CHECKPOINT_CAMERAS.get(checkpoint, [])
            cameras = [
                cam for cam in data.get('value', [])
                if cam['CameraID'] in camera_ids
            ]

            return cameras

        except Exception as e:
            logger.error(f"Error fetching LTA traffic images: {e}")
            return None

    def get_traffic_speed_bands(self) -> Optional[Dict]:
        """Get current traffic speed bands"""
        if not self.api_key:
            return None

        try:
            response = requests.get(
                f"{self.BASE_URL}/TrafficSpeedBandsv2",
                headers=self.headers,
                timeout=10
            )
            response.raise_for_status()
            return response.json()

        except Exception as e:
            logger.error(f"Error fetching LTA speed bands: {e}")
            return None


class CheckpointWaitTimeEstimator:
    """Estimate wait times at border checkpoints"""

    # Historical average wait times (minutes) by hour and day type
    WAIT_TIME_PATTERNS = {
        'woodlands': {
            'weekday': {
                'singapore_to_jb': {
                    6: 15, 7: 25, 8: 35, 9: 20, 10: 10, 11: 8, 12: 10,
                    13: 8, 14: 8, 15: 10, 16: 15, 17: 30, 18: 40, 19: 35,
                    20: 25, 21: 15, 22: 10, 23: 8, 0: 5, 1: 5, 2: 5, 3: 5, 4: 5, 5: 8
                },
                'jb_to_singapore': {
                    6: 20, 7: 40, 8: 50, 9: 30, 10: 15, 11: 10, 12: 12,
                    13: 10, 14: 10, 15: 12, 16: 20, 17: 35, 18: 45, 19: 40,
                    20: 30, 21: 20, 22: 12, 23: 10, 0: 8, 1: 5, 2: 5, 3: 5, 4: 5, 5: 10
                }
            },
            'weekend': {
                'singapore_to_jb': {
                    6: 10, 7: 15, 8: 25, 9: 30, 10: 20, 11: 15, 12: 12,
                    13: 10, 14: 12, 15: 15, 16: 20, 17: 25, 18: 30, 19: 25,
                    20: 20, 21: 15, 22: 12, 23: 10, 0: 8, 1: 5, 2: 5, 3: 5, 4: 5, 5: 8
                },
                'jb_to_singapore': {
                    6: 15, 7: 25, 8: 35, 9: 40, 10: 30, 11: 20, 12: 18,
                    13: 15, 14: 18, 15: 25, 16: 35, 17: 45, 18: 50, 19: 45,
                    20: 35, 21: 25, 22: 18, 23: 15, 0: 10, 1: 8, 2: 5, 3: 5, 4: 5, 5: 10
                }
            }
        },
        'tuas': {
            'weekday': {
                'singapore_to_jb': {
                    6: 8, 7: 12, 8: 15, 9: 10, 10: 5, 11: 5, 12: 5,
                    13: 5, 14: 5, 15: 8, 16: 10, 17: 15, 18: 20, 19: 18,
                    20: 12, 21: 8, 22: 5, 23: 5, 0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 5
                },
                'jb_to_singapore': {
                    6: 10, 7: 18, 8: 25, 9: 15, 10: 8, 11: 5, 12: 8,
                    13: 5, 14: 5, 15: 10, 16: 15, 17: 20, 18: 25, 19: 22,
                    20: 15, 21: 10, 22: 8, 23: 5, 0: 5, 1: 3, 2: 3, 3: 3, 4: 3, 5: 5
                }
            },
            'weekend': {
                'singapore_to_jb': {
                    6: 5, 7: 8, 8: 12, 9: 15, 10: 10, 11: 8, 12: 8,
                    13: 5, 14: 8, 15: 10, 16: 12, 17: 15, 18: 18, 19: 15,
                    20: 10, 21: 8, 22: 5, 23: 5, 0: 3, 1: 3, 2: 3, 3: 3, 4: 3, 5: 5
                },
                'jb_to_singapore': {
                    6: 8, 7: 12, 8: 18, 9: 20, 10: 15, 11: 10, 12: 12,
                    13: 8, 14: 12, 15: 18, 16: 25, 17: 30, 18: 35, 19: 30,
                    20: 20, 21: 15, 22: 10, 23: 8, 0: 5, 1: 3, 2: 3, 3: 3, 4: 3, 5: 5
                }
            }
        }
    }

    def estimate_wait_time(
        self,
        checkpoint: str,
        direction: str,
        hour: int,
        is_weekend: bool,
        is_holiday: bool = False
    ) -> Dict[str, float]:
        """
        Estimate checkpoint wait time

        Args:
            checkpoint: 'woodlands' or 'tuas'
            direction: 'singapore_to_jb' or 'jb_to_singapore'
            hour: Hour of day (0-23)
            is_weekend: Whether it's a weekend
            is_holiday: Whether it's a holiday

        Returns:
            Dict with estimated wait times
        """
        day_type = 'weekend' if is_weekend else 'weekday'

        base_wait = self.WAIT_TIME_PATTERNS.get(checkpoint, {}).get(
            day_type, {}
        ).get(direction, {}).get(hour, 10)

        # Apply holiday multiplier
        if is_holiday:
            base_wait *= 1.5

        # Add variance
        min_wait = max(2, base_wait * 0.7)
        max_wait = base_wait * 1.3

        return {
            'estimated_wait_minutes': round(base_wait, 1),
            'min_wait_minutes': round(min_wait, 1),
            'max_wait_minutes': round(max_wait, 1),
            'confidence': 'medium'  # Would be 'high' with real-time data
        }
