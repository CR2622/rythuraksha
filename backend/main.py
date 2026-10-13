"""
Developer 2 & 4 Module: RythuRaksha AI FastAPI Backend Server
Implements the complete CP-01 through CP-06 API Contract + Teammate Adapter Aliases.
"""

import os
from typing import Any, Dict, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from database import (
    create_incident_case,
    get_case,
    init_db,
    list_cases,
    list_fields,
    update_case_assessment,
    update_case_draft,
    update_case_status,
)
from weather import fetch_historical_weather
from satellite import analyze_field_satellite, load_fields_geojson
from agents import (
    generate_claim,
    run_agent1_damage_analysis,
    run_agent3_telugu_assistant,
)
from pdf_generator import generate_claim_pdf

load_dotenv()

app = FastAPI(
    title="RythuRaksha AI API",
    description="Dual-Portal Tri-Agent Climate-Smart Crop Insurance & Loan Assistant (VNR VJIET Hackathon Team 33)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


# ============================================================================
# REQUEST MODELS (Forgiving schemas so teammates' payloads work smoothly)
# ============================================================================
class IncidentCreateRequest(BaseModel):
    field_id: str = "FIELD001"
    weather_event: str = "Heavy rainfall"
    event_date: str = "2024-09-01"
    farmer_notes: Optional[str] = ""
    crop: Optional[str] = None


class AssessmentTriggerRequest(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class ClaimDraftRequest(BaseModel):
    case_id: str = "RR001"
    document_type: str = "INSURANCE_CLAIM"  # "INSURANCE_CLAIM" or "LOAN_RELIEF"


class StatusUpdateRequest(BaseModel):
    status: str
    reviewer_comments: Optional[str] = None


class AssistantQueryRequest(BaseModel):
    question: str
    case_id: Optional[str] = "RR001"


# ============================================================================
# CP-01 & CP-06 ENDPOINTS
# ============================================================================
@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    hf_configured = bool(os.getenv("HF_TOKEN", "").strip())
    return {
        "status": "healthy",
        "service": "RythuRaksha AI Backend",
        "team": "Team 33 — VNR VJIET AI Engineering Hackathon",
        "database": "SQLite connected",
        "hf_configured": hf_configured,
        "hf_model": os.getenv("HF_MODEL", "Qwen/Qwen2.5-72B-Instruct"),
        "agents": ["Agent 1: Crop Damage", "Agent 2: Hugging Face Finance", "Agent 3: Telugu Assistant"],
    }


@app.get("/api/fields")
def get_demo_fields() -> Dict[str, Any]:
    """Returns both the SQLite field list and the raw GeoJSON FeatureCollection."""
    init_db()
    return {
        "fields": list_fields(),
        "geojson": load_fields_geojson(),
    }


@app.get("/api/weather")
def get_weather_endpoint(
    lat: float = Query(17.9689, description="Field latitude"),
    lon: float = Query(79.5941, description="Field longitude"),
    start: str = Query("2024-08-28", description="Start date YYYY-MM-DD"),
    end: str = Query("2024-09-06", description="End date YYYY-MM-DD"),
) -> Dict[str, Any]:
    """CP-03 Step 2 endpoint: GET /api/weather?lat=17.9689&lon=79.5941&start=2024-08-28&end=2024-09-06"""
    return fetch_historical_weather(lat=lat, lon=lon, start_date=start, end_date=end)


@app.get("/api/satellite/{field_id}")
def get_satellite_endpoint(field_id: str) -> Dict[str, Any]:
    """Returns verified Sentinel-2 NDVI observations for a given field_id."""
    return analyze_field_satellite(field_id=field_id)


@app.post("/api/incidents")
def report_crop_damage_incident(payload: IncidentCreateRequest) -> Dict[str, Any]:
    """Creates a new crop damage case in SQLite."""
    case = create_incident_case(
        field_id=payload.field_id,
        weather_event=payload.weather_event,
        event_date=payload.event_date,
        farmer_notes=payload.farmer_notes or "",
        crop_override=payload.crop,
    )
    return {"message": "Incident recorded in SQLite", "case": case}


@app.post("/api/assessments/{id}")
def run_assessment_endpoint(
    id: str,
    payload: Optional[AssessmentTriggerRequest] = None,
) -> Dict[str, Any]:
    """
    CP-03 & CP-06 Agent 1 Endpoint:
    Accepts either a case_id (e.g., RR001) or field_id (e.g., FIELD001),
    runs Agent 1 (Open-Meteo + Verified Sentinel-2 NDVI), and saves to SQLite.
    """
    case = get_case(id)
    if not case:
        # If called with a field_id that has no case yet, create one automatically
        case = create_incident_case(
            field_id=id,
            weather_event="Heavy rainfall",
            event_date="2024-09-01",
            farmer_notes="Auto-created from field assessment trigger.",
        )

    start_date = payload.start_date if payload else None
    end_date = payload.end_date if payload else None

    assessment = run_agent1_damage_analysis(
        field_id=case["field_id"],
        lat=float(case.get("lat") or 17.9689),
        lon=float(case.get("lon") or 79.5941),
        crop=case.get("crop", "Paddy"),
        weather_event=case.get("weather_event", "Heavy rainfall"),
        event_date=case.get("event_date", "2024-09-01"),
        start_date=start_date,
        end_date=end_date,
    )

    updated_case = update_case_assessment(case["case_id"], assessment)
    return {
        "assessment": assessment,
        "case": updated_case,
    }


@app.post("/api/claims/draft")
def generate_claim_draft_endpoint(payload: ClaimDraftRequest) -> Dict[str, Any]:
    """
    CP-04 & CP-06 Agent 2 Endpoint:
    Retrieves the saved assessment from SQLite, calls Hugging Face to draft either
    an Insurance Claim or Loan Relief Request, and saves the draft to SQLite.
    """
    case = get_case(payload.case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{payload.case_id}' not found.")

    # If Agent 1 hasn't run yet on this case, run it automatically so Agent 2 has real evidence!
    if case.get("evidence_quality") == "pending_analysis" or case.get("rainfall_mm") is None:
        assessment = run_agent1_damage_analysis(
            field_id=case["field_id"],
            lat=float(case.get("lat") or 17.9689),
            lon=float(case.get("lon") or 79.5941),
            crop=case.get("crop", "Paddy"),
            weather_event=case.get("weather_event", "Heavy rainfall"),
            event_date=case.get("event_date", "2024-09-01"),
        )
        case = update_case_assessment(case["case_id"], assessment) or case

    draft_text, model_used = generate_claim(
        context=case,
        document_type=payload.document_type,
    )
    updated_case = update_case_draft(
        case_id=case["case_id"],
        document_type=payload.document_type,
        ai_draft=draft_text,
        ai_model_used=model_used,
    )
    return {
        "case_id": case["case_id"],
        "document_type": payload.document_type,
        "ai_draft": draft_text,
        "ai_model_used": model_used,
        "case": updated_case,
    }


@app.post("/api/claims/{id}/submit")
def submit_claim_for_review(id: str) -> Dict[str, Any]:
    """
    CP-04 Step 6 & CP-06 Endpoint:
    Farmer submits the generated claim/loan request to the institutional portal.
    """
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{id}' not found.")

    updated_case = update_case_status(
        case_id=case["case_id"],
        status="Pending Review",
        reviewer_comments="Submitted by farmer with Agent 1 & Agent 2 supporting evidence. Awaiting institutional officer review.",
    )
    return {
        "message": f"Case {case['case_id']} submitted to Institution Portal.",
        "case": updated_case,
    }


@app.get("/api/cases")
def get_all_cases() -> Dict[str, Any]:
    """CP-06 Institutional & Farmer shared case list with summary counts."""
    cases = list_cases()
    total = len(cases)
    pending = sum(1 for c in cases if c.get("status") in ("Pending", "Pending Review", "SUBMITTED", "PENDING_REVIEW"))
    under_review = sum(1 for c in cases if c.get("status") in ("Under Review", "UNDER_REVIEW"))
    completed = sum(1 for c in cases if c.get("status") in ("Completed", "COMPLETED", "Approved", "APPROVED"))

    return {
        "summary": {
            "total_requests": total,
            "pending_review": pending,
            "under_review": under_review,
            "completed": completed,
        },
        "cases": cases,
    }


@app.get("/api/cases/{id}")
def get_single_case(id: str) -> Dict[str, Any]:
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{id}' not found.")
    return {"case": case}


@app.patch("/api/cases/{id}/status")
def update_case_review_status(id: str, payload: StatusUpdateRequest) -> Dict[str, Any]:
    """CP-06 Institutional reviewer updates status and comments in SQLite."""
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{id}' not found.")

    updated = update_case_status(
        case_id=case["case_id"],
        status=payload.status,
        reviewer_comments=payload.reviewer_comments,
    )
    return {
        "message": f"Case {case['case_id']} updated to '{payload.status}'.",
        "case": updated,
    }


@app.post("/api/assistant/query")
def query_telugu_assistant(payload: AssistantQueryRequest) -> Dict[str, Any]:
    """CP-05 & CP-06 Agent 3 Telugu Assistant endpoint grounded on SQLite case data."""
    case = get_case(payload.case_id or "RR001")
    if not case:
        cases = list_cases()
        case = cases[0] if cases else {"case_id": "RR001", "status": "Pending", "crop": "Paddy"}

    return run_agent3_telugu_assistant(
        question=payload.question,
        case_context=case,
    )


@app.get("/api/claims/{id}/pdf")
def download_claim_pdf(id: str) -> Response:
    """CP-04 & CP-06 ReportLab PDF download endpoint."""
    case = get_case(id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{id}' not found.")

    pdf_bytes = generate_claim_pdf(case)
    filename = f"RythuRaksha_{case['case_id']}_{case.get('document_type', 'CLAIM')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
