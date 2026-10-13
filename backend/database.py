"""
Developer 2 Module: Shared SQLite Persistence Layer (rythuraksha.db)
Single source of truth for both Farmer Portal and Institutional Reviewer Portal.
"""

import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from satellite import analyze_field_satellite, load_fields_geojson

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "rythuraksha.db")))
if not DB_PATH.is_absolute():
    DB_PATH = (BASE_DIR / DB_PATH).resolve()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Creates tables and seeds demo fields + initial case RR001 if empty."""
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS fields (
            field_id TEXT PRIMARY KEY,
            farmer_id TEXT,
            farmer_name TEXT,
            farmer_name_te TEXT,
            village TEXT,
            mandal TEXT,
            district TEXT,
            survey_no TEXT,
            pattadar_passbook TEXT,
            crop TEXT,
            crop_variety TEXT,
            crop_te TEXT,
            area_acres REAL,
            lat REAL,
            lon REAL,
            default_event_date TEXT,
            satellite_available INTEGER,
            geometry_json TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS cases (
            case_id TEXT PRIMARY KEY,
            field_id TEXT NOT NULL,
            farmer_name TEXT NOT NULL,
            farmer_name_te TEXT,
            village TEXT,
            district TEXT,
            survey_no TEXT,
            area_acres REAL,
            crop TEXT NOT NULL,
            weather_event TEXT NOT NULL,
            event_date TEXT NOT NULL,
            farmer_notes TEXT,
            lat REAL,
            lon REAL,
            rainfall_mm REAL,
            peak_daily_rainfall_mm REAL,
            max_temp_c REAL,
            weather_json TEXT,
            ndvi_before REAL,
            ndvi_after REAL,
            ndvi_change REAL,
            ndvi_drop_pct REAL,
            pre_obs_date TEXT,
            post_obs_date TEXT,
            satellite_json TEXT,
            evidence_quality TEXT DEFAULT 'pending_analysis',
            assessment_result TEXT DEFAULT 'Assessment pending',
            limitations TEXT,
            document_type TEXT DEFAULT 'INSURANCE_CLAIM',
            ai_draft TEXT,
            ai_model_used TEXT,
            status TEXT DEFAULT 'Pending',
            reviewer_comments TEXT,
            created_at TEXT,
            updated_at TEXT
        )
        """
    )

    # Seed fields from demo_data/field.geojson
    geojson = load_fields_geojson()
    for feat in geojson.get("features", []):
        props = feat.get("properties", {})
        fid = props.get("field_id") or feat.get("id")
        cur.execute("SELECT 1 FROM fields WHERE field_id = ?", (fid,))
        if not cur.fetchone():
            cur.execute(
                """
                INSERT INTO fields (
                    field_id, farmer_id, farmer_name, farmer_name_te,
                    village, mandal, district, survey_no, pattadar_passbook,
                    crop, crop_variety, crop_te, area_acres, lat, lon,
                    default_event_date, satellite_available, geometry_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    fid,
                    props.get("farmer_id", "FARMER-001"),
                    props.get("farmer_name", "B. Ramesh Goud"),
                    props.get("farmer_name_te", "బి. రమేష్ గౌడ్"),
                    props.get("village", "Duggondi"),
                    props.get("mandal", "Narsampet"),
                    props.get("district", "Warangal, Telangana"),
                    props.get("survey_no", "SY-114/A"),
                    props.get("pattadar_passbook", "PPB-TS-8841209"),
                    props.get("crop", "Paddy"),
                    props.get("crop_variety", "Telangana Sona"),
                    props.get("crop_te", "వరి"),
                    float(props.get("area_acres", 4.2)),
                    float(props.get("lat", 17.9689)),
                    float(props.get("lon", 79.5941)),
                    props.get("default_event_date", "2024-09-01"),
                    1 if props.get("satellite_available", True) else 0,
                    json.dumps(feat.get("geometry", {})),
                ),
            )

    # Seed initial case RR001 matching the CP-02 specification table:
    # RR001 | Paddy | Heavy rainfall | Pending
    cur.execute("SELECT COUNT(*) as cnt FROM cases")
    row = cur.fetchone()
    if row and row["cnt"] == 0:
        sat = analyze_field_satellite("FIELD001")
        now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            """
            INSERT INTO cases (
                case_id, field_id, farmer_name, farmer_name_te,
                village, district, survey_no, area_acres,
                crop, weather_event, event_date, farmer_notes,
                lat, lon, rainfall_mm, peak_daily_rainfall_mm, max_temp_c, weather_json,
                ndvi_before, ndvi_after, ndvi_change, ndvi_drop_pct,
                pre_obs_date, post_obs_date, satellite_json,
                evidence_quality, assessment_result, limitations,
                document_type, ai_draft, ai_model_used,
                status, reviewer_comments, created_at, updated_at
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?
            )
            """,
            (
                "RR001",
                "FIELD001",
                "B. Ramesh Goud",
                "బి. రమేష్ గౌడ్",
                "Duggondi, Narsampet",
                "Warangal, Telangana",
                "SY-114/A",
                4.2,
                "Paddy",
                "Heavy rainfall",
                "2024-09-01",
                "Extreme monsoon depression caused waterlogging across 4.2 acres of standing Paddy crop during vegetative/panicle stage.",
                17.9689,
                79.5941,
                None,
                None,
                None,
                None,
                sat.get("ndvi_before"),
                sat.get("ndvi_after"),
                sat.get("ndvi_change"),
                sat.get("ndvi_drop_pct"),
                sat.get("pre_event", {}).get("acquisition_date") if sat.get("pre_event") else None,
                sat.get("post_event", {}).get("acquisition_date") if sat.get("post_event") else None,
                json.dumps(sat),
                "pending_analysis",
                "Assessment pending — Click 'Run Agent 1 Damage Analysis' to fetch live Open-Meteo rainfall & combine with Sentinel-2 NDVI.",
                sat.get("limitations"),
                "INSURANCE_CLAIM",
                None,
                None,
                "Pending",
                "Awaiting Agent 1 weather & satellite verification and farmer claim submission.",
                now_iso,
                now_iso,
            ),
        )

    conn.commit()
    conn.close()


def _row_to_case_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    for json_col in ("weather_json", "satellite_json"):
        raw = d.get(json_col)
        if raw and isinstance(raw, str):
            try:
                d[json_col.replace("_json", "_data")] = json.loads(raw)
            except Exception:
                d[json_col.replace("_json", "_data")] = None
        else:
            d[json_col.replace("_json", "_data")] = None
    return d


def list_fields() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM fields ORDER BY field_id ASC")
    rows = cur.fetchall()
    conn.close()
    results = []
    for r in rows:
        item = dict(r)
        item["satellite_available"] = bool(item.get("satellite_available"))
        if item.get("geometry_json"):
            try:
                item["geometry"] = json.loads(item["geometry_json"])
            except Exception:
                item["geometry"] = None
        results.append(item)
    return results


def list_cases() -> List[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases ORDER BY created_at DESC, case_id DESC")
    rows = cur.fetchall()
    conn.close()
    return [_row_to_case_dict(r) for r in rows]


def get_case(case_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM cases WHERE case_id = ? OR field_id = ? ORDER BY created_at DESC LIMIT 1", (case_id, case_id))
    row = cur.fetchone()
    conn.close()
    return _row_to_case_dict(row) if row else None


def generate_next_case_id() -> str:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM cases")
    cnt = cur.fetchone()["cnt"]
    conn.close()
    return f"RR{cnt + 1:03d}"


def create_incident_case(
    field_id: str,
    weather_event: str,
    event_date: str,
    farmer_notes: str = "",
    crop_override: Optional[str] = None,
) -> Dict[str, Any]:
    fields = {f["field_id"]: f for f in list_fields()}
    f_meta = fields.get(field_id, fields.get("FIELD001", {}))

    case_id = generate_next_case_id()
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO cases (
            case_id, field_id, farmer_name, farmer_name_te,
            village, district, survey_no, area_acres,
            crop, weather_event, event_date, farmer_notes,
            lat, lon, evidence_quality, assessment_result,
            document_type, status, reviewer_comments, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            case_id,
            field_id,
            f_meta.get("farmer_name", "B. Ramesh Goud"),
            f_meta.get("farmer_name_te", "బి. రమేష్ గౌడ్"),
            f"{f_meta.get('village', 'Duggondi')}, {f_meta.get('mandal', 'Narsampet')}",
            f_meta.get("district", "Warangal, Telangana"),
            f_meta.get("survey_no", "SY-114/A"),
            float(f_meta.get("area_acres", 4.2)),
            crop_override or f_meta.get("crop", "Paddy"),
            weather_event,
            event_date,
            farmer_notes,
            float(f_meta.get("lat", 17.9689)),
            float(f_meta.get("lon", 79.5941)),
            "pending_analysis",
            "Assessment pending",
            "INSURANCE_CLAIM",
            "Pending",
            "Incident reported by farmer. Ready for Agent 1 damage assessment.",
            now_iso,
            now_iso,
        ),
    )
    conn.commit()
    conn.close()
    return get_case(case_id)  # type: ignore


def update_case_assessment(case_id: str, assessment_payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE cases
        SET rainfall_mm = ?,
            peak_daily_rainfall_mm = ?,
            max_temp_c = ?,
            weather_json = ?,
            ndvi_before = ?,
            ndvi_after = ?,
            ndvi_change = ?,
            ndvi_drop_pct = ?,
            pre_obs_date = ?,
            post_obs_date = ?,
            satellite_json = ?,
            evidence_quality = ?,
            assessment_result = ?,
            limitations = ?,
            updated_at = ?
        WHERE case_id = ?
        """,
        (
            assessment_payload.get("rainfall_mm"),
            assessment_payload.get("peak_daily_rainfall_mm"),
            assessment_payload.get("max_temp_c"),
            json.dumps(assessment_payload.get("weather_data", {})),
            assessment_payload.get("ndvi_before"),
            assessment_payload.get("ndvi_after"),
            assessment_payload.get("ndvi_change"),
            assessment_payload.get("ndvi_drop_pct"),
            assessment_payload.get("pre_obs_date"),
            assessment_payload.get("post_obs_date"),
            json.dumps(assessment_payload.get("satellite_data", {})),
            assessment_payload.get("evidence_quality", "pending_analysis"),
            assessment_payload.get("result", "Assessment completed"),
            assessment_payload.get("limitations"),
            now_iso,
            case_id,
        ),
    )
    conn.commit()
    conn.close()
    return get_case(case_id)


def update_case_draft(
    case_id: str,
    document_type: str,
    ai_draft: str,
    ai_model_used: str,
) -> Optional[Dict[str, Any]]:
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE cases
        SET document_type = ?,
            ai_draft = ?,
            ai_model_used = ?,
            updated_at = ?
        WHERE case_id = ?
        """,
        (document_type, ai_draft, ai_model_used, now_iso, case_id),
    )
    conn.commit()
    conn.close()
    return get_case(case_id)


def update_case_status(
    case_id: str,
    status: str,
    reviewer_comments: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    now_iso = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    conn = get_connection()
    cur = conn.cursor()
    if reviewer_comments is not None:
        cur.execute(
            """
            UPDATE cases
            SET status = ?, reviewer_comments = ?, updated_at = ?
            WHERE case_id = ?
            """,
            (status, reviewer_comments, now_iso, case_id),
        )
    else:
        cur.execute(
            """
            UPDATE cases
            SET status = ?, updated_at = ?
            WHERE case_id = ?
            """,
            (status, now_iso, case_id),
        )
    conn.commit()
    conn.close()
    return get_case(case_id)
