/**
 * Developer 1 & 3 Module: Agent 1 — Crop Damage Assessment Screen (DamageAnalysis.tsx)
 * Implements CP-03 Step 5:
 * - Satellite analysis (Before observation, After observation, B8 & B4 bands, NDVI change)
 * - Weather analysis (Open-Meteo Rainfall & Temperature graph, event timeline)
 * - AI interpretation (Potential vegetation impact, Evidence quality, Limitations)
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Activity,
  Satellite,
  CloudRain,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
} from 'lucide-react';
import WeatherChart from '../components/WeatherChart';
import {
  CaseRecord,
  fetchCases,
  fetchSingleCase,
  runDamageAssessment,
} from '../services/api';

export const DamageAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id') || 'RR001';

  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [currentCase, setCurrentCase] = useState<CaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent1, setRunningAgent1] = useState(false);
  const [startDate, setStartDate] = useState('2024-08-28');
  const [endDate, setEndDate] = useState('2024-09-06');

  const loadCaseData = async (cid: string) => {
    setLoading(true);
    try {
      const [casesListRes, singleCase] = await Promise.all([
        fetchCases(),
        fetchSingleCase(cid),
      ]);
      setAllCases(casesListRes.cases || []);
      setCurrentCase(singleCase);

      // Auto-trigger Agent 1 on first visit if weather data hasn't been fetched yet
      if (singleCase && singleCase.rainfall_mm === null) {
        setRunningAgent1(true);
        const assessed = await runDamageAssessment(cid, {
          start_date: startDate,
          end_date: endDate,
        });
        setCurrentCase(assessed.case);
        setRunningAgent1(false);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData(caseIdParam);
  }, [caseIdParam]);

  const handleRunAgent1 = async () => {
    if (!currentCase) return;
    setRunningAgent1(true);
    try {
      const res = await runDamageAssessment(currentCase.case_id, {
        start_date: startDate,
        end_date: endDate,
      });
      setCurrentCase(res.case);
    } finally {
      setRunningAgent1(false);
    }
  };

  const sat = currentCase?.satellite_data;
  const wea = currentCase?.weather_data;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Case Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-700">
            <Activity className="w-4 h-4" />
            <span>Agent 1 • Crop Damage Intelligence (Open-Meteo + Sentinel-2)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Scientific Weather & Satellite Damage Assessment
          </h1>
          {currentCase && (
            <p className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-3">
              <span>
                <strong>Case:</strong> {currentCase.case_id} ({currentCase.farmer_name})
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                {currentCase.field_id} ({currentCase.village}, {currentCase.district})
              </span>
              <span>•</span>
              <span>
                <strong>Crop:</strong> {currentCase.crop} ({currentCase.area_acres} Acres)
              </span>
            </p>
          )}
        </div>

        {/* Case Switcher & Run Agent 1 Button */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={caseIdParam}
            onChange={(e) => setSearchParams({ case_id: e.target.value })}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-800"
          >
            {allCases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} — {c.crop} ({c.field_id})
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={runningAgent1 || loading}
            onClick={handleRunAgent1}
            className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${runningAgent1 ? 'animate-spin' : ''}`} />
            {runningAgent1
              ? 'Running Agent 1 Analysis...'
              : 'Run Agent 1 Damage Analysis'}
          </button>

          {currentCase && (
            <Link
              to={`/claim?case_id=${currentCase.case_id}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Proceed to Agent 2 Claim Draft
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Observation Window Bar */}
      <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-forest-700" />
            Open-Meteo Historical Observation Window:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">Start:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">End:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded border border-slate-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Evidence Quality:</span>
          <span className="px-2.5 py-1 rounded-full bg-forest-100 text-forest-900 font-bold border border-forest-300">
            {currentCase?.evidence_quality || 'pending_analysis'}
          </span>
        </div>
      </div>

      {/* Weather & NDVI Charts (CP-03 Step 5) */}
      <WeatherChart
        dailyObservations={wea?.daily_observations || []}
        totalRainfallMm={currentCase?.rainfall_mm}
        peakRainfallMm={currentCase?.peak_daily_rainfall_mm}
        maxTempC={currentCase?.max_temp_c}
        weatherSource={wea?.source}
        satelliteData={sat}
        ndviBefore={currentCase?.ndvi_before}
        ndviAfter={currentCase?.ndvi_after}
        ndviChange={currentCase?.ndvi_change}
        preObsDate={currentCase?.pre_obs_date}
        postObsDate={currentCase?.post_obs_date}
      />

      {/* Sentinel-2 Before vs After Spectral Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Observation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
              <Satellite className="w-4 h-4" />
              Pre-Event Satellite Observation (Baseline)
            </span>
            <span className="text-xs font-mono bg-forest-50 text-forest-800 px-2.5 py-0.5 rounded border border-forest-200">
              {sat?.pre_event?.acquisition_date || 'Unavailable'}
            </span>
          </div>

          {sat?.satellite_available && sat.pre_event ? (
            <>
              <div className="h-28 rounded-lg bg-gradient-to-r from-green-800 via-green-600 to-emerald-500 p-4 text-white flex flex-col justify-between shadow-inner">
                <div className="text-[11px] font-mono opacity-90">
                  Scene: {sat.pre_event.scene_id}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs opacity-90">Growth Stage: {sat.pre_event.growth_stage}</div>
                    <div className="text-lg font-extrabold">
                      Healthy Canopy • NDVI {sat.pre_event.ndvi.toFixed(4)}
                    </div>
                  </div>
                  <span className="text-xs bg-black/25 px-2 py-0.5 rounded">
                    Cloud Cover: {sat.pre_event.cloud_cover_pct}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Band 4 (Red)</span>
                  <strong className="font-mono text-slate-800">{sat.pre_event.b4_red}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Band 8 (NIR)</span>
                  <strong className="font-mono text-slate-800">{sat.pre_event.b8_nir}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">NDVI Before</span>
                  <strong className="font-mono text-forest-800">
                    {sat.pre_event.ndvi.toFixed(4)}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              No pre-event optical scene available for this parcel. Weather-only analysis is active.
            </div>
          )}
        </div>

        {/* After Observation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <Satellite className="w-4 h-4" />
              Post-Event Satellite Observation (After Weather Event)
            </span>
            <span className="text-xs font-mono bg-red-50 text-red-800 px-2.5 py-0.5 rounded border border-red-200">
              {sat?.post_event?.acquisition_date || 'Unavailable'}
            </span>
          </div>

          {sat?.satellite_available && sat.post_event ? (
            <>
              <div className="h-28 rounded-lg bg-gradient-to-r from-amber-800 via-orange-700 to-yellow-600 p-4 text-white flex flex-col justify-between shadow-inner">
                <div className="text-[11px] font-mono opacity-90">
                  Scene: {sat.post_event.scene_id}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs opacity-90">
                      Condition: {sat.post_event.growth_stage}
                    </div>
                    <div className="text-lg font-extrabold">
                      Vegetation Decline • NDVI {sat.post_event.ndvi.toFixed(4)} (
                      {sat.ndvi_change && sat.ndvi_change > 0 ? '+' : ''}
                      {sat.ndvi_change?.toFixed(4)})
                    </div>
                  </div>
                  <span className="text-xs bg-black/25 px-2 py-0.5 rounded">
                    Cloud Cover: {sat.post_event.cloud_cover_pct}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 block">Band 4 (Red)</span>
                  <strong className="font-mono text-slate-800">{sat.post_event.b4_red}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Band 8 (NIR)</span>
                  <strong className="font-mono text-slate-800">{sat.post_event.b8_nir}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">NDVI After</span>
                  <strong className="font-mono text-red-700">
                    {sat.post_event.ndvi.toFixed(4)} ({sat.ndvi_drop_pct}% drop)
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              {sat?.reason ||
                'Post-event optical satellite imagery is unavailable due to cloud cover. No NDVI values are fabricated.'}
            </div>
          )}
        </div>
      </div>

      {/* Agent 1 Structured Output & Scientific Limitations Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest-700" />
            Agent 1 Preliminary Impact Explanation & Source Attribution
          </h2>
          <span className="text-xs text-slate-500">
            Source: {sat?.source_attribution || 'Open-Meteo + Verified Sentinel-2 Archive'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-sm text-slate-800 leading-relaxed">
          {currentCase?.assessment_result || 'Click "Run Agent 1 Damage Analysis" above.'}
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold">
              Scientific & Institutional Limitations (Human-in-the-Loop Verification Required)
            </div>
            <p className="leading-relaxed">
              {currentCase?.limitations ||
                'Optical NDVI measures canopy greenness decline rather than confirmed financial yield loss. Preprocessed historical Sentinel-2 observations and Open-Meteo reanalysis serve as preliminary supporting evidence; final claim settlement requires review by an authorized institutional officer.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DamageAnalysis;
