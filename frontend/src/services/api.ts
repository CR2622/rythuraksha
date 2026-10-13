/**
 * Developer 4 Module: Unified API Service Layer (frontend/src/services/api.ts)
 * Connects Farmer Portal & Institutional Reviewer Portal to the FastAPI + SQLite backend.
 */

import axios from 'axios';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FieldItem {
  field_id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_name_te?: string;
  village: string;
  mandal: string;
  district: string;
  survey_no: string;
  pattadar_passbook: string;
  crop: string;
  crop_variety?: string;
  crop_te?: string;
  area_acres: number;
  lat: number;
  lon: number;
  default_event_date: string;
  satellite_available: boolean;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
}

export interface DailyWeatherObs {
  date: string;
  precipitation_mm: number | null;
  temp_max_c: number | null;
}

export interface WeatherData {
  status: string;
  source: string;
  coordinates: { lat: number; lon: number };
  start_date: string;
  end_date: string;
  total_rainfall_mm: number | null;
  peak_daily_rainfall_mm: number | null;
  peak_rain_date: string | null;
  max_temperature_c: number | null;
  daily_observations: DailyWeatherObs[];
  error?: string | null;
}

export interface SatelliteData {
  field_id: string;
  satellite_available: boolean;
  sensor: string | null;
  tile_id?: string | null;
  source_attribution: string;
  pre_event: {
    scene_id: string;
    acquisition_date: string;
    cloud_cover_pct: number;
    b4_red: number;
    b8_nir: number;
    ndvi: number;
    growth_stage: string;
  } | null;
  post_event: {
    scene_id: string;
    acquisition_date: string;
    cloud_cover_pct: number;
    b4_red: number;
    b8_nir: number;
    ndvi: number;
    growth_stage: string;
  } | null;
  ndvi_before: number | null;
  ndvi_after: number | null;
  ndvi_change: number | null;
  ndvi_drop_pct: number | null;
  timeline: Array<{
    date: string;
    b4_red: number;
    b8_nir: number;
    ndvi: number;
    note: string;
  }>;
  evidence_quality: string;
  reason?: string | null;
  limitations: string;
}

export interface CaseRecord {
  case_id: string;
  field_id: string;
  farmer_name: string;
  farmer_name_te?: string;
  village: string;
  district: string;
  survey_no: string;
  area_acres: number;
  crop: string;
  weather_event: string;
  event_date: string;
  farmer_notes?: string;
  lat: number;
  lon: number;
  rainfall_mm: number | null;
  peak_daily_rainfall_mm: number | null;
  max_temp_c: number | null;
  weather_data?: WeatherData | null;
  ndvi_before: number | null;
  ndvi_after: number | null;
  ndvi_change: number | null;
  ndvi_drop_pct: number | null;
  pre_obs_date: string | null;
  post_obs_date: string | null;
  satellite_data?: SatelliteData | null;
  evidence_quality: string;
  assessment_result: string;
  limitations?: string | null;
  document_type: 'INSURANCE_CLAIM' | 'LOAN_RELIEF';
  ai_draft: string | null;
  ai_model_used: string | null;
  status: string;
  reviewer_comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface CasesResponse {
  summary: {
    total_requests: number;
    pending_review: number;
    under_review: number;
    completed: number;
  };
  cases: CaseRecord[];
}

export interface AssistantResponse {
  case_id: string;
  question: string;
  answer_te: string;
  current_status: string;
  model_used: string;
}

// ============================================================================
// CP-01 & CP-06 API CALLS
// ============================================================================

export async function checkBackendHealth() {
  const res = await apiClient.get('/api/health');
  return res.data;
}

export async function fetchFields(): Promise<{ fields: FieldItem[]; geojson: any }> {
  const res = await apiClient.get('/api/fields');
  return res.data;
}

export async function fetchWeather(
  lat: number,
  lon: number,
  start = '2024-08-28',
  end = '2024-09-06'
): Promise<WeatherData> {
  const res = await apiClient.get('/api/weather', {
    params: { lat, lon, start, end },
  });
  return res.data;
}

export async function createIncident(payload: {
  field_id: string;
  weather_event: string;
  event_date: string;
  farmer_notes?: string;
  crop?: string;
}): Promise<{ message: string; case: CaseRecord }> {
  const res = await apiClient.post('/api/incidents', payload);
  return res.data;
}

export async function runDamageAssessment(
  caseOrFieldId: string,
  dateWindow?: { start_date?: string; end_date?: string }
): Promise<{ assessment: any; case: CaseRecord }> {
  const res = await apiClient.post(`/api/assessments/${caseOrFieldId}`, dateWindow || {});
  return res.data;
}

export async function generateClaimDraft(
  case_id: string,
  document_type: 'INSURANCE_CLAIM' | 'LOAN_RELIEF'
): Promise<{
  case_id: string;
  document_type: string;
  ai_draft: string;
  ai_model_used: string;
  case: CaseRecord;
}> {
  const res = await apiClient.post('/api/claims/draft', {
    case_id,
    document_type,
  });
  return res.data;
}

export async function submitClaimForReview(
  case_id: string
): Promise<{ message: string; case: CaseRecord }> {
  const res = await apiClient.post(`/api/claims/${case_id}/submit`);
  return res.data;
}

export async function fetchCases(): Promise<CasesResponse> {
  const res = await apiClient.get('/api/cases');
  return res.data;
}

export async function fetchSingleCase(case_id: string): Promise<CaseRecord> {
  const res = await apiClient.get(`/api/cases/${case_id}`);
  return res.data.case;
}

export async function updateCaseStatus(
  case_id: string,
  status: string,
  reviewer_comments?: string
): Promise<{ message: string; case: CaseRecord }> {
  const res = await apiClient.patch(`/api/cases/${case_id}/status`, {
    status,
    reviewer_comments,
  });
  return res.data;
}

export async function askTeluguAssistant(
  question: string,
  case_id = 'RR001'
): Promise<AssistantResponse> {
  const res = await apiClient.post('/api/assistant/query', {
    question,
    case_id,
  });
  return res.data;
}

export function getClaimPdfUrl(case_id: string): string {
  return `${API_BASE_URL}/api/claims/${case_id}/pdf`;
}
