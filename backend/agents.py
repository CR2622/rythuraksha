"""
Developer 2 & 3 Module: Tri-Agent AI Orchestration
- Agent 1: Crop Damage Intelligence (Open-Meteo + Verified Sentinel-2 NDVI)
- Agent 2: Financial AI Assistant (Hugging Face InferenceClient — Insurance Claim & Loan Relief Drafts)
- Agent 3: Telugu Farmer Assistant (Hugging Face InferenceClient — Case-aware Telugu guidance)
"""

import os
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
from huggingface_hub import InferenceClient

from weather import fetch_historical_weather
from satellite import analyze_field_satellite

load_dotenv()


def _get_hf_models() -> List[str]:
    primary = os.getenv("HF_MODEL", "Qwen/Qwen2.5-72B-Instruct").strip()
    fallbacks_raw = os.getenv(
        "HF_FALLBACK_MODELS",
        "Qwen/Qwen2.5-7B-Instruct,meta-llama/Llama-3.2-3B-Instruct,HuggingFaceH4/zephyr-7b-beta",
    )
    models = [primary] + [m.strip() for m in fallbacks_raw.split(",") if m.strip()]
    seen = set()
    ordered = []
    for m in models:
        if m and m not in seen:
            seen.add(m)
            ordered.append(m)
    return ordered


def _call_huggingface_chat(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 600,
) -> tuple[Optional[str], str]:
    """
    Calls Hugging Face InferenceClient chat completions across the configured model and fallback models.
    Returns (response_text, model_used_or_error_reason).
    """
    hf_token = os.getenv("HF_TOKEN", "").strip()
    if not hf_token:
        return None, "no_hf_token_configured"

    client = InferenceClient(api_key=hf_token, timeout=22)
    last_error = "unknown_error"

    for model_name in _get_hf_models():
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_tokens=max_tokens,
                temperature=0.2,
            )
            content = response.choices[0].message.content
            if content and content.strip():
                return content.strip(), f"huggingface:{model_name}"
        except Exception as exc:
            last_error = f"{model_name}: {str(exc)}"
            continue

    return None, f"hf_unavailable ({last_error})"


# ============================================================================
# AGENT 1: CROP DAMAGE INTELLIGENCE (Open-Meteo + Verified Sentinel-2 NDVI)
# ============================================================================
def run_agent1_damage_analysis(
    field_id: str,
    lat: float,
    lon: float,
    crop: str,
    weather_event: str,
    event_date: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Combines real Open-Meteo historical weather observations with verified Sentinel-2 NDVI evidence.
    Never fabricates rainfall or NDVI numbers.
    """
    weather_res = fetch_historical_weather(
        lat=lat,
        lon=lon,
        start_date=start_date,
        end_date=end_date,
        event_date=event_date,
    )
    sat_res = analyze_field_satellite(field_id=field_id)

    rainfall_mm = weather_res.get("total_rainfall_mm")
    peak_rain_mm = weather_res.get("peak_daily_rainfall_mm")
    max_temp_c = weather_res.get("max_temperature_c")

    ndvi_before = sat_res.get("ndvi_before")
    ndvi_after = sat_res.get("ndvi_after")
    ndvi_change = sat_res.get("ndvi_change")
    ndvi_drop_pct = sat_res.get("ndvi_drop_pct")

    pre_obs_date = (
        sat_res.get("pre_event", {}).get("acquisition_date")
        if sat_res.get("pre_event")
        else None
    )
    post_obs_date = (
        sat_res.get("post_event", {}).get("acquisition_date")
        if sat_res.get("post_event")
        else None
    )

    # Determine evidence quality & scientific interpretation strictly from observed data
    if sat_res.get("satellite_available") and rainfall_mm is not None:
        evidence_quality = "high_dual_source_verified"
    elif rainfall_mm is not None and not sat_res.get("satellite_available"):
        evidence_quality = "weather_only_satellite_unavailable"
    elif sat_res.get("satellite_available") and rainfall_mm is None:
        evidence_quality = "satellite_only_weather_unavailable"
    else:
        evidence_quality = "insufficient_observations"

    # Build transparent preliminary impact explanation
    summary_parts: List[str] = []
    if rainfall_mm is not None:
        summary_parts.append(
            f"Open-Meteo recorded {rainfall_mm} mm cumulative rainfall ({weather_res.get('start_date')} to {weather_res.get('end_date')}) "
            f"with a peak daily rainfall of {peak_rain_mm} mm on {weather_res.get('peak_rain_date')}."
        )
    else:
        summary_parts.append("Open-Meteo historical weather observations could not be retrieved for this window.")

    if ndvi_before is not None and ndvi_after is not None and ndvi_change is not None:
        summary_parts.append(
            f"Verified Sentinel-2 L2A observations show canopy NDVI changed from {ndvi_before:.4f} (on {pre_obs_date}) "
            f"to {ndvi_after:.4f} (on {post_obs_date}), a net change of {ndvi_change:+.4f} ({ndvi_drop_pct}% decline)."
        )
        if ndvi_change <= -0.25 and (rainfall_mm or 0) >= 80:
            summary_parts.append(
                f"Preliminary Finding: High-confidence vegetation decline on {crop} consistent with {weather_event} and surface waterlogging. "
                f"Note: Vegetation greenness decline is preliminary supporting evidence and must be verified by an authorized reviewer before final payout."
            )
        elif ndvi_change < -0.10:
            summary_parts.append(
                f"Preliminary Finding: Moderate canopy decline observed on {crop}. Field verification recommended."
            )
        else:
            summary_parts.append(
                f"Preliminary Finding: Minimal canopy NDVI change detected across the observation window."
            )
    else:
        summary_parts.append(
            "Satellite NDVI Analysis: Cloud-free Sentinel-2 observations are unavailable for this parcel. "
            "This assessment is strictly weather-based and does not fabricate spectral indices."
        )

    result_text = " ".join(summary_parts)

    return {
        "field_id": field_id,
        "crop": crop,
        "weather_event": weather_event,
        "event_date": event_date,
        "rainfall_mm": rainfall_mm,
        "peak_daily_rainfall_mm": peak_rain_mm,
        "max_temp_c": max_temp_c,
        "ndvi_before": ndvi_before,
        "ndvi_after": ndvi_after,
        "ndvi_change": ndvi_change,
        "ndvi_drop_pct": ndvi_drop_pct,
        "pre_obs_date": pre_obs_date,
        "post_obs_date": post_obs_date,
        "evidence_quality": evidence_quality,
        "result": result_text,
        "limitations": sat_res.get("limitations"),
        "weather_data": weather_res,
        "satellite_data": sat_res,
    }


# ============================================================================
# AGENT 2: HUGGING FACE FINANCIAL AI ASSISTANT (Claim & Loan Relief Drafts)
# ============================================================================
def generate_claim(context: Dict[str, Any], document_type: str = "INSURANCE_CLAIM") -> tuple[str, str]:
    """
    CP-04 Agent 2 Implementation:
    Uses Hugging Face InferenceClient to generate an evidence-backed Crop Insurance Claim Draft
    or Agricultural Loan Relief Request Draft using ONLY supplied facts.
    """
    doc_label = (
        "Agricultural Crop Insurance Claim Draft"
        if document_type == "INSURANCE_CLAIM"
        else "Agricultural Crop Loan Relief & Rescheduling Request Draft"
    )

    system_prompt = (
        f"You are Agent 2 (Financial Documentation AI) for RythuRaksha AI. "
        f"You prepare formal {doc_label} documents for Indian agricultural institutions and banks. "
        "CRITICAL RULES:\n"
        "1. Use ONLY the supplied facts from the verified case context.\n"
        "2. Do NOT invent policy numbers, insurance company names, exact damage percentages, or rupee compensation amounts.\n"
        "3. Explicitly include satellite acquisition dates, Open-Meteo rainfall measurements, and NDVI values if present.\n"
        "4. If satellite NDVI is null/unavailable, explicitly state that the request relies on weather-only evidence.\n"
        "5. State clearly that satellite vegetation decline is preliminary supporting evidence subject to institutional human verification.\n"
        "6. Format clearly with sections: Document Header, Farmer & Field Details, Reported Weather Event, "
        "Verified Weather & Satellite Evidence, Preliminary Findings & Limitations, Formal Request, and Supporting Documents Checklist."
    )

    user_prompt = (
        f"Prepare a complete {doc_label} strictly from the following verified database record:\n\n"
        f"- Case ID: {context.get('case_id')}\n"
        f"- Farmer Name: {context.get('farmer_name')} ({context.get('farmer_name_te', '')})\n"
        f"- Location / Village / District: {context.get('village')}, {context.get('district')}\n"
        f"- Survey No & Area: {context.get('survey_no')} ({context.get('area_acres')} Acres)\n"
        f"- GPS Coordinates: {context.get('lat')}, {context.get('lon')}\n"
        f"- Crop Cultivated: {context.get('crop')}\n"
        f"- Reported Weather Event & Date: {context.get('weather_event')} on {context.get('event_date')}\n"
        f"- Farmer Field Notes: {context.get('farmer_notes') or 'None provided'}\n"
        f"- Open-Meteo Cumulative Rainfall (mm): {context.get('rainfall_mm')}\n"
        f"- Open-Meteo Peak Daily Rainfall (mm): {context.get('peak_daily_rainfall_mm')}\n"
        f"- Open-Meteo Max Temperature (°C): {context.get('max_temp_c')}\n"
        f"- Sentinel-2 Pre-Event Observation Date & NDVI: {context.get('pre_obs_date')} | NDVI Before = {context.get('ndvi_before')}\n"
        f"- Sentinel-2 Post-Event Observation Date & NDVI: {context.get('post_obs_date')} | NDVI After = {context.get('ndvi_after')}\n"
        f"- Calculated NDVI Change: {context.get('ndvi_change')} ({context.get('ndvi_drop_pct')}% drop)\n"
        f"- Evidence Quality Classification: {context.get('evidence_quality')}\n"
        f"- Agent 1 Preliminary Findings: {context.get('assessment_result')}\n"
        f"- Scientific Limitations: {context.get('limitations')}\n"
    )

    llm_text, model_info = _call_huggingface_chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        max_tokens=650,
    )

    if llm_text:
        return llm_text, model_info

    # Deterministic, fact-only fallback if Hugging Face provider is unreachable
    sat_line = (
        f"Pre-event NDVI ({context.get('pre_obs_date')}): {context.get('ndvi_before')} | "
        f"Post-event NDVI ({context.get('post_obs_date')}): {context.get('ndvi_after')} | "
        f"Net NDVI Change: {context.get('ndvi_change')}"
        if context.get("ndvi_before") is not None
        else "Satellite NDVI observations unavailable due to cloud cover (Weather-Only Analysis Mode)."
    )

    fallback_draft = f"""====================================================================
{doc_label.upper()}
Case Reference: {context.get('case_id')} | Evidence Quality: {context.get('evidence_quality')}
====================================================================

1. FARMER & FIELD DETAILS
- Farmer Name: {context.get('farmer_name')}
- Village & District: {context.get('village')}, {context.get('district')}
- Survey Number: {context.get('survey_no')}
- Cultivated Area: {context.get('area_acres')} Acres
- Coordinates: Lat {context.get('lat')}, Lon {context.get('lon')}
- Crop: {context.get('crop')}

2. REPORTED WEATHER INCIDENT
- Event Type: {context.get('weather_event')}
- Reported Event Date: {context.get('event_date')}
- Farmer Statement: {context.get('farmer_notes') or 'Standing crop affected by extreme weather.'}

3. VERIFIED METEOROLOGICAL & SATELLITE EVIDENCE
- Weather Source (Open-Meteo Historical API):
  * Cumulative Rainfall: {context.get('rainfall_mm') if context.get('rainfall_mm') is not None else 'Pending/Unavailable'} mm
  * Peak Daily Rainfall: {context.get('peak_daily_rainfall_mm') if context.get('peak_daily_rainfall_mm') is not None else 'N/A'} mm
  * Maximum Temperature: {context.get('max_temp_c') if context.get('max_temp_c') is not None else 'N/A'} °C
- Satellite Source (Preprocessed Historical Sentinel-2 L2A):
  * {sat_line}

4. PRELIMINARY FINDINGS & SCIENTIFIC LIMITATIONS
- {context.get('assessment_result')}
- Limitation Notice: {context.get('limitations') or 'Satellite vegetation decline is preliminary supporting evidence; final loss determination requires authorized field inspection.'}

5. FORMAL REQUEST TO INSTITUTION
Based on the verified environmental observations above, the applicant respectfully requests an official field inspection and processing of this {doc_label} in accordance with applicable institutional norms. No unverified policy numbers or compensation figures are claimed in this draft.

6. SUPPORTING DOCUMENTS ATTACHED
[x] Pattadar Passbook / Land Record Reference ({context.get('survey_no')})
[x] Open-Meteo Historical Precipitation & Temperature Log
[x] Copernicus Sentinel-2 NDVI Assessment Report
"""
    return fallback_draft, f"fallback_template ({model_info})"


# ============================================================================
# AGENT 3: TELUGU FARMER ASSISTANT
# ============================================================================
def run_agent3_telugu_assistant(
    question: str,
    case_context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    CP-05 Agent 3 Implementation:
    Answers farmer questions in simple, clear Telugu using the current farmer's live SQLite case record.
    Never uses fake application statuses.
    """
    case_id = case_context.get("case_id", "RR001")
    farmer_name = case_context.get("farmer_name_te") or case_context.get("farmer_name", "రైతు")
    crop = case_context.get("crop", "Paddy")
    weather_event = case_context.get("weather_event", "Heavy rainfall")
    event_date = case_context.get("event_date", "2024-09-01")
    rainfall_mm = case_context.get("rainfall_mm")
    ndvi_before = case_context.get("ndvi_before")
    ndvi_after = case_context.get("ndvi_after")
    ndvi_change = case_context.get("ndvi_change")
    status = case_context.get("status", "Pending")
    doc_type = case_context.get("document_type", "INSURANCE_CLAIM")
    reviewer_comments = case_context.get("reviewer_comments") or "ఇంకా అదనపు వ్యాఖ్యలు లేవు."

    system_prompt = (
        "You are Agent 3 (RythuRaksha Telugu Farmer Assistant / రైతు రక్ష తెలుగు సహాయకుడు). "
        "Explain the farmer's crop assessment, insurance claim status, and loan relief steps in simple, warm, respectful Telugu (తెలుగు). "
        "CRITICAL RULES:\n"
        "1. Use ONLY the live database values provided below. Never invent application statuses, policy numbers, or payout amounts.\n"
        "2. Respond primarily in clear Telugu script so the farmer can read and listen to it easily.\n"
        "3. Include a brief 1-2 line English summary at the very end labeled 'English Summary:' for institutional clarity.\n"
        "4. Remind the farmer that satellite and weather findings are preliminary evidence and final approval is done by bank/insurance officers."
    )

    user_prompt = (
        f"Farmer Question: {question}\n\n"
        f"Live Authorized Case Details from SQLite Database:\n"
        f"- Case ID: {case_id}\n"
        f"- Farmer: {farmer_name}\n"
        f"- Crop: {crop}\n"
        f"- Weather Event: {weather_event} on {event_date}\n"
        f"- Open-Meteo Rainfall: {rainfall_mm if rainfall_mm is not None else 'ఇంకా విశ్లేషణ జరగలేదు (Not analyzed yet)'} mm\n"
        f"- Sentinel-2 NDVI Before: {ndvi_before}, NDVI After: {ndvi_after}, Change: {ndvi_change}\n"
        f"- Document Type: {doc_type}\n"
        f"- Current Official Status: {status}\n"
        f"- Institutional Reviewer Comments: {reviewer_comments}\n\n"
        "Please answer the farmer's question accurately in simple Telugu based on these exact details."
    )

    llm_reply, model_info = _call_huggingface_chat(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        max_tokens=450,
    )

    if llm_reply:
        return {
            "case_id": case_id,
            "question": question,
            "answer_te": llm_reply,
            "current_status": status,
            "model_used": model_info,
        }

    # Reliable Telugu fallback grounded on live SQLite state
    q_lower = question.lower()
    rain_str = f"{rainfall_mm} మి.మీ." if rainfall_mm is not None else "ఇంకా లెక్కించబడలేదు"
    ndvi_str = (
        f"ఉపగ్రహ పచ్చదనం సూచిక (NDVI) {ndvi_before} నుండి {ndvi_after} కు తగ్గింది (మార్పు: {ndvi_change})"
        if ndvi_before is not None and ndvi_after is not None
        else "ఈ పొలానికి ఉపగ్రహ చిత్రాలు అందుబాటులో లేవు (వాతావరణ ఆధారిత విశ్లేషణ మాత్రమే)"
    )

    status_te_map = {
        "Pending": "పెండింగ్‌లో ఉంది (Pending Review)",
        "PENDING_REVIEW": "సమీక్ష కోసం పెండింగ్‌లో ఉంది (Pending Review)",
        "SUBMITTED": "సమర్పించబడింది - సమీక్ష కోసం వేచి ఉంది (Submitted for Review)",
        "UNDER_REVIEW": "అధికారుల పరిశీలనలో ఉంది (Under Review)",
        "Under Review": "అధికారుల పరిశీలనలో ఉంది (Under Review)",
        "COMPLETED": "ఆమోదించబడింది / పూర్తయింది (Completed & Approved)",
        "Completed": "ఆమోదించబడింది / పూర్తయింది (Completed & Approved)",
        "Approved": "ఆమోదించబడింది (Approved)",
        "Rejected": "తిరస్కరించబడింది / అదనపు సమాచారం కావాలి (Requires Additional Verification)",
    }
    status_te = status_te_map.get(status, status)

    if "పంట" in question or "పరిస్థితి" in question or "crop" in q_lower or "condition" in q_lower:
        answer_te = (
            f"నమస్కారం {farmer_name} గారు! మీ కేసు ({case_id}) ప్రకారం, మీ {crop} పంటపై {event_date} నాటి '{weather_event}' ప్రభావం పడింది. "
            f"ఓపెన్-మెటియో (Open-Meteo) వాతావరణ నివేదిక ప్రకారం {rain_str} వర్షపాతం నమోదైంది. "
            f"అలాగే సెంటినెల్-2 (Sentinel-2) ఉపగ్రహ విశ్లేషణలో {ndvi_str}. ఇది పంటపై ఒత్తిడి మరియు నష్టాన్ని సూచిస్తుంది. "
            f"(గమనిక: ఇది ప్రాథమిక సాంకేతిక ఆధారం మాత్రమే, తుది నిర్ధారణ అధికారుల పరిశీలనపై ఆధారపడి ఉంటుంది.)\n\n"
            f"English Summary: Case {case_id} ({crop}) recorded {rainfall_mm or 'pending'} mm rainfall and NDVI change of {ndvi_change}."
        )
    elif "క్లెయిమ్" in question or "స్థితి" in question or "status" in q_lower or "claim" in q_lower:
        answer_te = (
            f"నమస్కారం {farmer_name} గారు! మీ దరఖాస్తు సంఖ్య {case_id} యొక్క ప్రస్తుత స్థితి: **{status_te}**. "
            f"బ్యాంకు/బీమా అధికారి వ్యాఖ్యలు: \"{reviewer_comments}\". "
            f"అధికారులు మీ వాతావరణ ({rain_str}) మరియు ఉపగ్రహ ఆధారాలను పరిశీలిస్తున్నారు.\n\n"
            f"English Summary: Application {case_id} status is currently '{status}'. Reviewer note: {reviewer_comments}"
        )
    elif "లోన్" in question or "రిలీఫ్" in question or "loan" in q_lower:
        answer_te = (
            f"నమస్కారం {farmer_name} గారు! పంట రుణ ఉపశమనం (Loan Relief) కోసం దరఖాస్తు చేయడానికి:\n"
            f"1. ముందుగా 'Damage Assessment' పేజీలో Agent 1 ద్వారా వాతావరణ మరియు ఉపగ్రహ ఆధారాలను సేకరించండి.\n"
            f"2. ఆపై 'Claim & Loan Generation' పేజీలో 'Generate Loan Relief Request' బటన్ నొక్కండి.\n"
            f"3. AI తయారు చేసిన దరఖాస్తు మరియు PDF నివేదికను డౌన్‌లోడ్ చేసుకుని, 'Submit for Review' నొక్కండి. "
            f"ప్రస్తుతం మీ కేసు ({case_id}) స్థితి: **{status_te}**.\n\n"
            f"English Summary: Select 'Loan Relief Request' on the Claim page, generate the evidence-backed draft via Agent 2, download the PDF, and click 'Submit for Review'."
        )
    else:
        answer_te = (
            f"నమస్కారం {farmer_name} గారు! మీ కేసు సంఖ్య {case_id} ({crop} పంట). "
            f"ప్రస్తుత దరఖాస్తు స్థితి: **{status_te}**. నమోదైన వర్షపాతం: {rain_str}. {ndvi_str}. "
            f"అధికారి వ్యాఖ్యలు: \"{reviewer_comments}\".\n\n"
            f"English Summary: Case {case_id} for {crop} is currently '{status}'."
        )

    return {
        "case_id": case_id,
        "question": question,
        "answer_te": answer_te,
        "current_status": status,
        "model_used": f"telugu_case_template ({model_info})",
    }
