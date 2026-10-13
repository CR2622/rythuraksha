/**
 * Developer 4 Module: Bank & Insurance Reviewer Portal (InstitutionDashboard.tsx)
 * Implements CP-02 & CP-06 Institutional Portal Requirements:
 * - 4 Summary Cards: TOTAL REQUESTS, PENDING REVIEW, UNDER REVIEW, COMPLETED
 * - Cases Table: Case ID | Crop | Event | Status | View Details
 * - Case Review Screen: Farmer details, Field location, Weather evidence, Satellite analysis,
 *   AI-generated claim, Reviewer comments, Change status button (persisted to SQLite)
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  FileSearch,
  FolderKanban,
  Download,
  RefreshCw,
  MapPin,
  CloudRain,
  Satellite,
  FileText,
  Save,
} from 'lucide-react';
import {
  CaseRecord,
  fetchCases,
  getClaimPdfUrl,
  updateCaseStatus,
} from '../services/api';

export const InstitutionDashboard: React.FC = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [summary, setSummary] = useState({
    total_requests: 0,
    pending_review: 0,
    under_review: 0,
    completed: 0,
  });
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [statusInput, setStatusInput] = useState('Under Review');
  const [commentsInput, setCommentsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadCases = async (preserveCaseId?: string) => {
    setLoading(true);
    try {
      const res = await fetchCases();
      const list = res.cases || [];
      setCases(list);
      setSummary(res.summary);

      const target =
        list.find((c) => c.case_id === (preserveCaseId || selectedCase?.case_id)) ||
        list[0] ||
        null;
      if (target) {
        selectCaseForReview(target);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const selectCaseForReview = (c: CaseRecord) => {
    setSelectedCase(c);
    setStatusInput(c.status || 'Under Review');
    setCommentsInput(c.reviewer_comments || '');
    setSaveMessage(null);
  };

  const handleUpdateStatus = async (newStatus?: string) => {
    if (!selectedCase) return;
    const finalStatus = newStatus || statusInput;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await updateCaseStatus(
        selectedCase.case_id,
        finalStatus,
        commentsInput
      );
      setStatusInput(finalStatus);
      setSelectedCase(res.case);
      await loadCases(res.case.case_id);
      setSaveMessage(
        `Status for ${res.case.case_id} updated to "${finalStatus}" in SQLite! The Farmer Portal and Agent 3 Telugu Assistant are now synchronized.`
      );
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('approved')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (s.includes('under')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (s.includes('reject')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Portal Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-forest-900 text-white flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
              Demo Institutional Reviewer Role
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Bank & Agricultural Insurance Case-Review Dashboard
            </h1>
            <p className="text-xs text-slate-600">
              Inspect verified weather & satellite evidence, review Hugging Face claim drafts, and update application status.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadCases()}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync SQLite Database
        </button>
      </div>

      {/* 4 Required Summary Cards (CP-02 Institutional Portal) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              TOTAL REQUESTS
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {summary.total_requests}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              PENDING REVIEW
            </div>
            <div className="text-3xl font-extrabold text-amber-800 mt-1">
              {summary.pending_review}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700">
              UNDER REVIEW
            </div>
            <div className="text-3xl font-extrabold text-blue-800 mt-1">
              {summary.under_review}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileSearch className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
              COMPLETED
            </div>
            <div className="text-3xl font-extrabold text-forest-800 mt-1">
              {summary.completed}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content: Cases Table + Detailed Case Review Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Cases Table (CP-02 Spec) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Submitted & Active Cases Queue
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase">
                  <th className="py-2.5 px-3 font-bold">Case ID</th>
                  <th className="py-2.5 px-3 font-bold">Crop</th>
                  <th className="py-2.5 px-3 font-bold">Event</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">View Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cases.map((c) => {
                  const isSelected = selectedCase?.case_id === c.case_id;
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => selectCaseForReview(c)}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-forest-50/90' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-forest-900">{c.case_id}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{c.crop}</td>
                      <td className="py-3 px-3 text-slate-600">{c.weather_event}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCaseForReview(c);
                          }}
                          className="px-2.5 py-1 rounded bg-forest-800 text-white font-semibold hover:bg-forest-900"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 7 Columns: Case Review Screen */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          {selectedCase ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="text-xs font-bold uppercase text-forest-700">
                    Case Review Dossier • {selectedCase.case_id}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedCase.farmer_name} — {selectedCase.crop} ({selectedCase.area_acres}{' '}
                    Acres)
                  </h2>
                </div>

                <a
                  href={getClaimPdfUrl(selectedCase.case_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download Official PDF
                </a>
              </div>

              {saveMessage && (
                <div className="p-3.5 rounded-xl bg-green-50 border border-green-300 text-green-900 text-xs font-semibold">
                  {saveMessage}
                </div>
              )}

              {/* Evidence Grid: Farmer, Field, Weather, Satellite */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    Farmer & Field Location
                  </div>
                  <div>Field ID: {selectedCase.field_id}</div>
                  <div>Survey: {selectedCase.survey_no}</div>
                  <div>
                    {selectedCase.village}, {selectedCase.district}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    GPS: {selectedCase.lat}, {selectedCase.lon}
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CloudRain className="w-4 h-4 text-blue-700" />
                    Open-Meteo Weather
                  </div>
                  <div>Event: {selectedCase.weather_event}</div>
                  <div>Date: {selectedCase.event_date}</div>
                  <div>
                    Total Rain:{' '}
                    <strong>
                      {selectedCase.rainfall_mm !== null
                        ? `${selectedCase.rainfall_mm} mm`
                        : 'Pending'}
                    </strong>
                  </div>
                  <div>
                    Peak Day:{' '}
                    <strong>
                      {selectedCase.peak_daily_rainfall_mm !== null
                        ? `${selectedCase.peak_daily_rainfall_mm} mm`
                        : 'N/A'}
                    </strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Satellite className="w-4 h-4 text-forest-700" />
                    Sentinel-2 NDVI Analysis
                  </div>
                  <div>
                    NDVI Before ({selectedCase.pre_obs_date || 'N/A'}):{' '}
                    <strong>
                      {selectedCase.ndvi_before !== null
                        ? selectedCase.ndvi_before.toFixed(4)
                        : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    NDVI After ({selectedCase.post_obs_date || 'N/A'}):{' '}
                    <strong>
                      {selectedCase.ndvi_after !== null
                        ? selectedCase.ndvi_after.toFixed(4)
                        : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    NDVI Change:{' '}
                    <strong className="text-red-700">
                      {selectedCase.ndvi_change !== null
                        ? `${selectedCase.ndvi_change.toFixed(4)} (${selectedCase.ndvi_drop_pct}% drop)`
                        : 'Weather-Only'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* AI-Generated Claim / Loan Draft Preview */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-forest-700" />
                    AI-Generated Claim / Loan Relief Document ({selectedCase.document_type})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Evidence Quality: {selectedCase.evidence_quality}
                  </span>
                </div>
                <pre className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedCase.ai_draft ||
                    selectedCase.assessment_result ||
                    'No AI claim draft attached yet.'}
                </pre>
              </div>

              {/* Reviewer Decision & Status Update Controls */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Institutional Officer Review & Status Update
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Application Status
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Completed">Completed (Approved)</option>
                      <option value="Rejected">Requires Field Inspection</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Reviewer Comments (Shared with Farmer & Telugu AI Assistant)
                    </label>
                    <input
                      type="text"
                      value={commentsInput}
                      onChange={(e) => setCommentsInput(e.target.value)}
                      placeholder="Enter institutional verification notes..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Quick One-Click Status Buttons + Save */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleUpdateStatus('Under Review')}
                      className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold"
                    >
                      Mark Under Review
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleUpdateStatus('Completed')}
                      className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 text-xs font-bold"
                    >
                      Approve & Mark Completed
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleUpdateStatus()}
                    className="px-5 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Updating SQLite...' : 'Save Status Update'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              Select a case from the table on the left to inspect evidence and update status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
