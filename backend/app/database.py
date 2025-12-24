"""
Database models and operations for historical crossing data
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class HistoricalDataDB:
    """SQLite database for storing historical crossing data"""

    def __init__(self, db_path: str = "./data/crossings.db"):
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def init_db(self):
        """Initialize database schema"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            # Crossings table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crossings (
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
                    rain_mm REAL,
                    is_holiday BOOLEAN,
                    day_of_week INTEGER,
                    hour_of_day INTEGER,
                    congestion_level TEXT,
                    predicted_time_minutes REAL,
                    prediction_error_minutes REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Real-time traffic snapshots
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS traffic_snapshots (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    checkpoint TEXT NOT NULL,
                    direction TEXT NOT NULL,
                    traffic_duration_minutes REAL NOT NULL,
                    wait_time_minutes REAL,
                    congestion_multiplier REAL,
                    source TEXT NOT NULL,
                    raw_data TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create indexes
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_crossings_timestamp
                ON crossings(timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_crossings_checkpoint
                ON crossings(checkpoint, timestamp)
            """)
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_traffic_timestamp
                ON traffic_snapshots(timestamp)
            """)

            conn.commit()
            logger.info("Database initialized successfully")

    def add_crossing(self, crossing_data: Dict) -> int:
        """Add a new crossing record"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO crossings (
                    timestamp, checkpoint, origin, destination, mode,
                    travel_time_minutes, wait_time_minutes, total_time_minutes,
                    weather_condition, temperature_c, rain_mm,
                    is_holiday, day_of_week, hour_of_day,
                    congestion_level, predicted_time_minutes, prediction_error_minutes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                crossing_data.get('timestamp'),
                crossing_data.get('checkpoint'),
                crossing_data.get('origin'),
                crossing_data.get('destination'),
                crossing_data.get('mode'),
                crossing_data.get('travel_time_minutes'),
                crossing_data.get('wait_time_minutes'),
                crossing_data.get('total_time_minutes'),
                crossing_data.get('weather_condition'),
                crossing_data.get('temperature_c'),
                crossing_data.get('rain_mm'),
                crossing_data.get('is_holiday'),
                crossing_data.get('day_of_week'),
                crossing_data.get('hour_of_day'),
                crossing_data.get('congestion_level'),
                crossing_data.get('predicted_time_minutes'),
                crossing_data.get('prediction_error_minutes')
            ))
            conn.commit()
            return cursor.lastrowid

    def add_traffic_snapshot(self, snapshot_data: Dict) -> int:
        """Add real-time traffic snapshot"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO traffic_snapshots (
                    timestamp, checkpoint, direction,
                    traffic_duration_minutes, wait_time_minutes,
                    congestion_multiplier, source, raw_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                snapshot_data.get('timestamp'),
                snapshot_data.get('checkpoint'),
                snapshot_data.get('direction'),
                snapshot_data.get('traffic_duration_minutes'),
                snapshot_data.get('wait_time_minutes'),
                snapshot_data.get('congestion_multiplier'),
                snapshot_data.get('source'),
                json.dumps(snapshot_data.get('raw_data', {}))
            ))
            conn.commit()
            return cursor.lastrowid

    def get_recent_crossings(
        self,
        checkpoint: str = None,
        hours: int = 24,
        limit: int = 100
    ) -> List[Dict]:
        """Get recent crossing data"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            query = """
                SELECT * FROM crossings
                WHERE timestamp >= datetime('now', '-' || ? || ' hours')
            """
            params = [hours]

            if checkpoint:
                query += " AND checkpoint = ?"
                params.append(checkpoint)

            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)

            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_average_by_hour(
        self,
        checkpoint: str,
        day_of_week: int = None
    ) -> List[Dict]:
        """Get average travel times by hour of day"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            query = """
                SELECT
                    hour_of_day,
                    AVG(total_time_minutes) as avg_time,
                    AVG(wait_time_minutes) as avg_wait,
                    COUNT(*) as sample_count
                FROM crossings
                WHERE checkpoint = ?
            """
            params = [checkpoint]

            if day_of_week is not None:
                query += " AND day_of_week = ?"
                params.append(day_of_week)

            query += " GROUP BY hour_of_day ORDER BY hour_of_day"

            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]

    def get_statistics(self) -> Dict:
        """Get database statistics"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM crossings")
            total_crossings = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM traffic_snapshots")
            total_snapshots = cursor.fetchone()[0]

            cursor.execute("""
                SELECT MIN(timestamp), MAX(timestamp)
                FROM crossings
            """)
            date_range = cursor.fetchone()

            return {
                'total_crossings': total_crossings,
                'total_traffic_snapshots': total_snapshots,
                'earliest_crossing': date_range[0],
                'latest_crossing': date_range[1]
            }


# Global database instance
db = HistoricalDataDB()
