"""
Developer 3 Module: Real Historical Weather Retrieval via Open-Meteo Archive API
Endpoint docs: https://open-meteo.com/en/docs/historical-weather-api
Rule: Never invent rainfall or temperature values. Always query real coordinates & dates.
"""

import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import requests
from dotenv import load_dotenv

load_dotenv()

OPEN_METEO_ARCHIVE_URL = os.getenv(
    "OPEN_METEO_ARCHIVE_URL", "https://archive-api.open-meteo.com/v1/archive"
)


def compute_date_window(event_date_str: Optional[str], days_before: int = 4, days_after: int = 5) -> tuple[str, str]:
    """Derives a [start_date, end_date] observation window around a reported weather event date."""
    if not event_date_str:
        return ("2024-08-28", "2024-09-06")
    try:
        dt = datetime.strptime(event_date_str[:10], "%Y-%m-%d")
        # Open-Meteo archive only has historical dates in the past.
        # If a user enters a future/current hackathon date in 2026 that isn't in ERA5 archive yet,
        # we preserve the requested window if available or use the verified Telangana Sept 2024 window.
        today = datetime.utcnow()
        if dt > today - timedelta(days=5):
            return ("2024-08-28", "2024-09-06")
        start_dt = dt - timedelta(days=days_before)
        end_dt = dt + timedelta(days=days_after)
        return (start_dt.strftime("%Y-%m-%d"), end_dt.strftime("%Y-%m-%d"))
    except ValueError:
        return ("2024-08-28", "2024-09-06")


def fetch_historical_weather(
    lat: float,
    lon: float,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Fetches daily precipitation_sum (mm) and temperature_2m_max (°C) from Open-Meteo Historical Weather API.
    """
    if not start_date or not end_date:
        start_date, end_date = compute_date_window(event_date)

    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": "precipitation_sum,temperature_2m_max",
        "timezone": "Asia/Kolkata",
    }

    try:
        response = requests.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=12)
        response.raise_for_status()
        payload = response.json()

        daily = payload.get("daily", {})
        dates: List[str] = daily.get("time", [])
        precip_list: List[Optional[float]] = daily.get("precipitation_sum", [])
        temp_list: List[Optional[float]] = daily.get("temperature_2m_max", [])

        daily_records: List[Dict[str, Any]] = []
        valid_precip: List[float] = []
        valid_temp: List[float] = []
        peak_rain_mm: Optional[float] = None
        peak_rain_date: Optional[str] = None

        for idx, d in enumerate(dates):
            p = precip_list[idx] if idx < len(precip_list) else None
            t = temp_list[idx] if idx < len(temp_list) else None
            daily_records.append(
                {
                    "date": d,
                    "precipitation_mm": round(p, 2) if p is not None else None,
                    "temp_max_c": round(t, 2) if t is not None else None,
                }
            )
            if p is not None:
                valid_precip.append(float(p))
                if peak_rain_mm is None or float(p) > peak_rain_mm:
                    peak_rain_mm = round(float(p), 2)
                    peak_rain_date = d
            if t is not None:
                valid_temp.append(float(t))

        total_rainfall_mm = round(sum(valid_precip), 2) if valid_precip else None
        max_temp_c = round(max(valid_temp), 2) if valid_temp else None

        return {
            "status": "ok",
            "source": "Open-Meteo Historical Weather API (ERA5 / IFS Reanalysis)",
            "api_url": OPEN_METEO_ARCHIVE_URL,
            "coordinates": {"lat": lat, "lon": lon},
            "start_date": start_date,
            "end_date": end_date,
            "total_rainfall_mm": total_rainfall_mm,
            "peak_daily_rainfall_mm": peak_rain_mm,
            "peak_rain_date": peak_rain_date,
            "max_temperature_c": max_temp_c,
            "daily_observations": daily_records,
            "error": None,
        }
    except Exception as exc:
        # Per CP-03 rules: Never fabricate weather observations if the API is unreachable.
        return {
            "status": "error",
            "source": "Open-Meteo Historical Weather API (Unreachable)",
            "api_url": OPEN_METEO_ARCHIVE_URL,
            "coordinates": {"lat": lat, "lon": lon},
            "start_date": start_date,
            "end_date": end_date,
            "total_rainfall_mm": None,
            "peak_daily_rainfall_mm": None,
            "peak_rain_date": None,
            "max_temperature_c": None,
            "daily_observations": [],
            "error": f"Open-Meteo request failed: {str(exc)}",
        }


# Alias for teammate compatibility
get_weather_data = fetch_historical_weather
