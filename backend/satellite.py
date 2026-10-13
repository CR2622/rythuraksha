"""
Developer 3 Module: Verified Historical Sentinel-2 NDVI Analysis
Formula: NDVI = (B8 - B4) / (B8 + B4)
Rule: Calculate NDVI strictly from authentic recorded band values.
      If satellite observations are unavailable for a field, return nulls and
      set evidence_quality = "weather_only_satellite_unavailable".
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DEMO_DATA_DIR = BASE_DIR / "demo_data"
GEOJSON_PATH = DEMO_DATA_DIR / "field.geojson"
SATELLITE_JSON_PATH = DEMO_DATA_DIR / "verified_satellite_data.json"


def calculate_ndvi(b8_nir: Optional[float], b4_red: Optional[float]) -> Optional[float]:
    """Computes Normalized Difference Vegetation Index: (B8 - B4) / (B8 + B4)."""
    if b8_nir is None or b4_red is None:
        return None
    denom = float(b8_nir) + float(b4_red)
    if denom == 0:
        return None
    return round((float(b8_nir) - float(b4_red)) / denom, 4)


def load_fields_geojson() -> Dict[str, Any]:
    """Loads the GeoJSON FeatureCollection from demo_data/field.geojson."""
    if not GEOJSON_PATH.exists():
        return {"type": "FeatureCollection", "features": []}
    with open(GEOJSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_field_by_id(field_id: str) -> Optional[Dict[str, Any]]:
    """Returns a single GeoJSON feature matching field_id."""
    geojson = load_fields_geojson()
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        if feature.get("id") == field_id or props.get("field_id") == field_id:
            return feature
    return None


def load_verified_satellite_catalog() -> Dict[str, Any]:
    """Loads demo_data/verified_satellite_data.json."""
    if not SATELLITE_JSON_PATH.exists():
        return {"metadata": {}, "fields": {}}
    with open(SATELLITE_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def analyze_field_satellite(field_id: str) -> Dict[str, Any]:
    """
    Computes pre-event and post-event NDVI from verified historical Sentinel-2 L2A bands.
    Never invents NDVI values when imagery is unavailable.
    """
    catalog = load_verified_satellite_catalog()
    fields_map = catalog.get("fields", {})
    record = fields_map.get(field_id)

    if not record or not record.get("available", False):
        reason = (
            record.get("reason", "No cloud-free Sentinel-2 scene available for this parcel.")
            if record
            else f"No preprocessed Sentinel-2 record found for {field_id}."
        )
        limitations = (
            record.get(
                "limitations",
                "Satellite imagery is not available for this location/date window. Assessment relies on weather observations only.",
            )
            if record
            else "Satellite imagery unavailable; weather-only risk assessment applied."
        )
        return {
            "field_id": field_id,
            "satellite_available": False,
            "sensor": None,
            "source_attribution": "Satellite Imagery Unavailable (Weather-Only Mode)",
            "pre_event": None,
            "post_event": None,
            "ndvi_before": None,
            "ndvi_after": None,
            "ndvi_change": None,
            "ndvi_drop_pct": None,
            "timeline": [],
            "evidence_quality": "weather_only_satellite_unavailable",
            "reason": reason,
            "limitations": limitations,
        }

    pre = record.get("pre_event", {})
    post = record.get("post_event", {})

    ndvi_before = calculate_ndvi(pre.get("b8_nir"), pre.get("b4_red"))
    ndvi_after = calculate_ndvi(post.get("b8_nir"), post.get("b4_red"))

    ndvi_change: Optional[float] = None
    ndvi_drop_pct: Optional[float] = None
    if ndvi_before is not None and ndvi_after is not None:
        ndvi_change = round(ndvi_after - ndvi_before, 4)
        if ndvi_before > 0:
            ndvi_drop_pct = round(((ndvi_before - ndvi_after) / ndvi_before) * 100.0, 2)

    timeline_raw: List[Dict[str, Any]] = record.get("historical_timeline", [])
    timeline_computed: List[Dict[str, Any]] = []
    for item in timeline_raw:
        val = calculate_ndvi(item.get("b8_nir"), item.get("b4_red"))
        timeline_computed.append(
            {
                "date": item.get("date"),
                "b4_red": item.get("b4_red"),
                "b8_nir": item.get("b8_nir"),
                "ndvi": val,
                "note": item.get("note", ""),
            }
        )

    return {
        "field_id": field_id,
        "satellite_available": True,
        "sensor": record.get("sensor", "Sentinel-2 MSI Level-2A"),
        "tile_id": record.get("tile_id"),
        "source_attribution": record.get(
            "source_attribution",
            "Preprocessed Historical Sentinel-2 L2A Evidence (Copernicus Open Access Hub)",
        ),
        "pre_event": {
            "scene_id": pre.get("scene_id"),
            "acquisition_date": pre.get("acquisition_date"),
            "cloud_cover_pct": pre.get("cloud_cover_pct"),
            "b4_red": pre.get("b4_red"),
            "b8_nir": pre.get("b8_nir"),
            "ndvi": ndvi_before,
            "growth_stage": pre.get("growth_stage"),
        },
        "post_event": {
            "scene_id": post.get("scene_id"),
            "acquisition_date": post.get("acquisition_date"),
            "cloud_cover_pct": post.get("cloud_cover_pct"),
            "b4_red": post.get("b4_red"),
            "b8_nir": post.get("b8_nir"),
            "ndvi": ndvi_after,
            "growth_stage": post.get("growth_stage"),
        },
        "ndvi_before": ndvi_before,
        "ndvi_after": ndvi_after,
        "ndvi_change": ndvi_change,
        "ndvi_drop_pct": ndvi_drop_pct,
        "timeline": timeline_computed,
        "evidence_quality": "verified_historical_sentinel2",
        "reason": None,
        "limitations": record.get(
            "limitations",
            "NDVI measures canopy vegetation decline rather than confirmed financial yield loss. Final claim approval requires authorized human inspection.",
        ),
    }


# Alias for teammate compatibility
get_satellite_evidence = analyze_field_satellite
