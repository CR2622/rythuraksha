"""
Developer 2 Module: Single-Page Evidence & Claim PDF Generator using ReportLab
Generates a downloadable PDF report for Insurance Claims and Loan Relief Requests.
Includes a pure-Python valid PDF fallback if ReportLab is missing.
"""

import io
import textwrap
from datetime import datetime
from typing import Any, Dict


def _build_reportlab_pdf(case_data: Dict[str, Any]) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Header Banner (Forest Green)
    c.setFillColor(colors.HexColor("#14532d"))
    c.rect(0, height - 82, width, 82, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(36, height - 34, "RYTHURAKSHA AI — VERIFIED CROP DAMAGE & CLAIM DOSSIER")

    c.setFont("Helvetica", 10)
    doc_type_label = (
        "CROP INSURANCE CLAIM DRAFT"
        if case_data.get("document_type") == "INSURANCE_CLAIM"
        else "AGRICULTURAL LOAN RELIEF REQUEST"
    )
    c.drawString(
        36,
        height - 52,
        f"Document Type: {doc_type_label}  |  Case ID: {case_data.get('case_id')}  |  Status: {case_data.get('status')}",
    )
    c.drawString(
        36,
        height - 68,
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}  |  VNR VJIET Hackathon Team 33",
    )

    y = height - 105

    def draw_section_header(title: str, y_pos: float) -> float:
        c.setFillColor(colors.HexColor("#f0fdf4"))
        c.rect(32, y_pos - 4, width - 64, 18, stroke=0, fill=1)
        c.setFillColor(colors.HexColor("#166534"))
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(38, y_pos, title)
        return y_pos - 18

    def draw_kv_line(text: str, y_pos: float, bold: bool = False) -> float:
        c.setFillColor(colors.HexColor("#1f2937"))
        c.setFont("Helvetica-Bold" if bold else "Helvetica", 9.5)
        c.drawString(40, y_pos, text)
        return y_pos - 13

    # Section 1: Farmer & Field Details
    y = draw_section_header("1. FARMER & REGISTERED FIELD DETAILS", y)
    y = draw_kv_line(
        f"Farmer Name: {case_data.get('farmer_name')}   |   Survey No: {case_data.get('survey_no')}   |   Area: {case_data.get('area_acres')} Acres",
        y,
    )
    y = draw_kv_line(
        f"Location: {case_data.get('village')}, {case_data.get('district')} (Lat: {case_data.get('lat')}, Lon: {case_data.get('lon')})",
        y,
    )
    y = draw_kv_line(
        f"Crop: {case_data.get('crop')}   |   Reported Event: {case_data.get('weather_event')} on {case_data.get('event_date')}",
        y,
    )
    y -= 6

    # Section 2: Agent 1 Weather & Satellite Evidence
    y = draw_section_header("2. AGENT 1: VERIFIED WEATHER & SATELLITE EVIDENCE", y)
    rain = case_data.get("rainfall_mm")
    peak_rain = case_data.get("peak_daily_rainfall_mm")
    max_t = case_data.get("max_temp_c")
    y = draw_kv_line(
        f"Open-Meteo Weather: Cumulative Rainfall = {rain if rain is not None else 'Pending'} mm  |  Peak Daily = {peak_rain if peak_rain is not None else 'N/A'} mm  |  Max Temp = {max_t if max_t is not None else 'N/A'} C",
        y,
    )

    ndvi_b = case_data.get("ndvi_before")
    ndvi_a = case_data.get("ndvi_after")
    ndvi_c = case_data.get("ndvi_change")
    if ndvi_b is not None and ndvi_a is not None:
        y = draw_kv_line(
            f"Sentinel-2 L2A NDVI: Pre-Event ({case_data.get('pre_obs_date')}) = {ndvi_b:.4f}  |  Post-Event ({case_data.get('post_obs_date')}) = {ndvi_a:.4f}  |  Change = {ndvi_c:+.4f}",
            y,
        )
    else:
        y = draw_kv_line(
            "Sentinel-2 L2A NDVI: Cloud-free satellite imagery unavailable for this parcel (Weather-Only Assessment Mode).",
            y,
        )
    y = draw_kv_line(f"Evidence Quality: {case_data.get('evidence_quality')}", y, bold=True)
    y -= 6

    # Section 3: Agent 2 Financial Claim / Loan Relief Draft
    y = draw_section_header(
        f"3. AGENT 2: AI-GENERATED {doc_type_label} ({case_data.get('ai_model_used') or 'Verified Draft'})",
        y,
    )
    draft_text = case_data.get("ai_draft") or case_data.get("assessment_result") or "Draft not generated yet."
    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica", 8.8)

    for raw_line in draft_text.splitlines():
        wrapped = textwrap.wrap(raw_line, width=96) or [""]
        for wline in wrapped:
            if y < 95:
                c.drawString(40, y, "... [Continued in Digital Case Record]")
                break
            c.drawString(40, y, wline)
            y -= 11
        if y < 95:
            break

    # Footer Box: Limitations & Institutional Reviewer Status
    c.setStrokeColor(colors.HexColor("#166534"))
    c.setFillColor(colors.HexColor("#f9fafb"))
    c.rect(32, 26, width - 64, 54, stroke=1, fill=1)
    c.setFillColor(colors.HexColor("#111827"))
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(
        40,
        66,
        f"Institutional Review Status: {case_data.get('status')}  |  Reviewer Notes: {(case_data.get('reviewer_comments') or 'Pending review')[:85]}",
    )
    c.setFont("Helvetica", 7.8)
    c.drawString(
        40,
        52,
        "Scientific Disclaimer: Satellite NDVI decline and Open-Meteo reanalysis provide preliminary environmental evidence.",
    )
    c.drawString(
        40,
        40,
        "Final insurance claim settlement or agricultural loan relief approval requires verification by an authorized officer.",
    )

    c.showPage()
    c.save()
    return buffer.getvalue()


def _build_fallback_pdf(case_data: Dict[str, Any]) -> bytes:
    """Minimal pure-Python valid PDF 1.4 generator if reportlab is unavailable."""
    lines = [
        "RYTHURAKSHA AI - VERIFIED EVIDENCE & CLAIM REPORT",
        f"Case ID: {case_data.get('case_id')} | Status: {case_data.get('status')}",
        f"Farmer: {case_data.get('farmer_name')} | Crop: {case_data.get('crop')} | Field: {case_data.get('field_id')}",
        f"Event: {case_data.get('weather_event')} on {case_data.get('event_date')}",
        f"Open-Meteo Rainfall (mm): {case_data.get('rainfall_mm')}",
        f"Sentinel-2 NDVI Before: {case_data.get('ndvi_before')} | After: {case_data.get('ndvi_after')} | Change: {case_data.get('ndvi_change')}",
        f"Evidence Quality: {case_data.get('evidence_quality')}",
    ]
    content_ops = ["BT", "/F1 11 Tf", "50 760 Td", "16 TL"]
    for ln in lines:
        safe = ln.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        content_ops.append(f"({safe}) Tj T*")
    content_ops.append("ET")
    stream_bytes = "\n".join(content_ops).encode("latin-1", errors="replace")

    objs = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        f"5 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
        + stream_bytes
        + b"\nendstream\nendobj\n",
    ]
    out = io.BytesIO()
    out.write(b"%PDF-1.4\n")
    offsets = []
    for o in objs:
        offsets.append(out.tell())
        out.write(o)
    xref_pos = out.tell()
    out.write(f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode("latin-1"))
    for off in offsets:
        out.write(f"{off:010d} 00000 n \n".encode("latin-1"))
    out.write(
        f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode(
            "latin-1"
        )
    )
    return out.getvalue()


def generate_claim_pdf(case_data: Dict[str, Any]) -> bytes:
    try:
        return _build_reportlab_pdf(case_data)
    except Exception:
        return _build_fallback_pdf(case_data)
