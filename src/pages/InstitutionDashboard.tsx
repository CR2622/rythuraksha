/**
 * Bank & Insurance Reviewer Portal (InstitutionDashboard.tsx)
 * Priority 4: Bank Experience & Priority 5: Evidence Passport with append-only audit trail.
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
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  History,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import {
  CaseRecord,
  fetchCases,
  getClaimPdfUrl,
  updateCaseStatus,
  fetchAuditTrail,
  AuditEvent,
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
  const [activeTab, setActiveTab] = useState<'passport' | 'document' | 'audit'>('passport');
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    setAuditTrail(c.audit_trail || []);
    // Also refresh live audit trail
    fetchAuditTrail(c.case_id)
      .then((res) => setAuditTrail(res.audit_trail || []))
      .catch(() => {});
  };

  const handleUpdateStatus = async (newStatus?: string, customComment?: string) => {
    if (!selectedCase) return;
    const finalStatus = newStatus || statusInput;
    const finalComment = customComment !== undefined ? customComment : commentsInput;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await updateCaseStatus(
        selectedCase.case_id,
        finalStatus,
        finalComment
      );
      setStatusInput(finalStatus);
      if (customComment !== undefined) setCommentsInput(customComment);
      setSelectedCase(res.case);
      setAuditTrail(res.case.audit_trail || []);
      await loadCases(res.case.case_id);
      setSaveMessage(
        `Case ${res.case.case_id} status updated to "${finalStatus}". Synchronized with Farmer Portal & Agent 3.`
      );
      setTimeout(() => setSaveMessage(null), 6000);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickApprove = () => {
    const note = 'Claim approved based on verified Open-Meteo precipitation anomaly and Sentinel-2 vegetation canopy loss evidence. Disbursal recommended.';
    handleUpdateStatus('Approved', note);
  };

  const handleQuickRequestInfo = () => {
    const note = 'Additional Information Requested: Farmer requested to upload updated land tenancy agreement / joint inspection report with Mandal Agricultural Officer.';
    handleUpdateStatus('Additional Info Requested', note);
  };

  const filteredCases = cases.filter((c) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'PENDING'
        ? ['Pending', 'Pending Review', 'SUBMITTED', 'PENDING_REVIEW'].includes(c.status)
        : filterStatus === 'UNDER_REVIEW'
        ? ['Under Review', 'UNDER_REVIEW'].includes(c.status)
        : filterStatus === 'APPROVED'
        ? ['Approved', 'APPROVED', 'Completed', 'COMPLETED'].includes(c.status)
        : filterStatus === 'INFO_REQUESTED'
        ? c.status === 'Additional Info Requested'
        : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.case_id.toLowerCase().includes(q) ||
      c.farmer_name.toLowerCase().includes(q) ||
      c.crop.toLowerCase().includes(q) ||
      c.village.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'COMPLETED':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'Under Review':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            Under Review
          </span>
        );
      case 'Additional Info Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-300">
            <AlertCircle className="w-3 h-3 text-purple-600" />
            Info Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#153E32] text-white flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#153E32]">
                Bank & Agricultural Insurer Review Portal
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Institutional Officer Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review climate-smart damage dossiers, inspect satellite NDVI proof, and record official claim determinations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadCases()}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* 4 Summary KPI Cards from Stored Cases */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 font-semibold">
            <span>TOTAL CLAIMS</span>
            <FolderKanban className="w-4 h-4 text-[#3B7C61]" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary.total_requests}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Recorded in SQLite database</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 font-semibold">
            <span>PENDING REVIEW</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {summary.pending_review}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting initial officer audit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm bg-blue-50/20">
          <div className="flex items-center justify-between text-blue-800 font-semibold">
            <span>UNDER REVIEW</span>
            <FileSearch className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {summary.under_review}
          </div>
          <div className="text-[11px] text-blue-700 mt-0.5">Active field / desk evaluation</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 font-semibold">
            <span>COMPLETED / APPROVED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {summary.completed}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Authorized settlements</div>
        </div>
      </div>

      {/* Main Grid: Cases List Table + Case Review Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable Cases Table */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-[#153E32] flex items-center gap-1.5">
                <FileSearch className="w-4 h-4 text-[#3B7C61]" />
                <span>Submitted Applications</span>
              </h2>
              <span className="text-xs font-bold text-slate-500">
                {filteredCases.length} records
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search case ID, farmer, crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'UNDER_REVIEW', label: 'Under Review' },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'INFO_REQUESTED', label: 'Info Req' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    filterStatus === tab.id
                      ? 'bg-[#153E32] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Case Cards List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredCases.map((c) => {
                const isSelected = c.case_id === selectedCase?.case_id;
                return (
                  <div
                    key={c.case_id}
                    onClick={() => selectCaseForReview(c)}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-[#153E32]/5 border-[#153E32] shadow-xs ring-1 ring-[#153E32]/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-[#153E32] text-sm">
                        {c.case_id}
                      </span>
                      {getStatusBadge(c.status)}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-slate-700">
                      <span className="font-semibold">{c.farmer_name}</span>
                      <span className="text-slate-500">{c.crop} • {c.area_acres} Ac</span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.weather_event} ({c.event_date})</span>
                      <span className="font-mono">
                        Rain: {c.rainfall_mm !== null ? `${c.rainfall_mm}mm` : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredCases.length === 0 && (
                <div className="py-10 text-center text-slate-400 text-xs">
                  No cases match the selected filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Case Dossier & Review Suite (Priority 5 Evidence Passport) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCase ? (
            <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm space-y-4">
              {/* Top Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-[#153E32]">
                      Case Dossier: {selectedCase.case_id}
                    </span>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <span className="text-xs text-slate-500 block">
                    Applicant: <strong>{selectedCase.farmer_name}</strong> ({selectedCase.village}, {selectedCase.district})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getClaimPdfUrl(selectedCase.case_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#153E32]" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>

              {/* Navigation Tabs: Evidence Passport | Claim Document | Audit Log */}
              <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('passport')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'passport'
                      ? 'border-[#153E32] text-[#153E32]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Evidence Passport (ఆధారాల పాస్‌పోర్ట్)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('document')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'document'
                      ? 'border-[#153E32] text-[#153E32]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AI Claim Document
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`pb-2 px-1 border-b-2 transition flex items-center gap-1 ${
                    activeTab === 'audit'
                      ? 'border-[#153E32] text-[#153E32]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit Trail ({auditTrail.length})</span>
                </button>
              </div>

              {/* Tab 1: Evidence Passport (Priority 5) */}
              {activeTab === 'passport' && (
                <div className="space-y-4 text-xs animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Farmer Reference:</span>
                      <strong className="text-slate-900">{selectedCase.farmer_name}</strong>
                      <span className="block text-slate-600 text-[11px]">
                        Passbook: {selectedCase.pattadar_passbook || 'PPB-TS-8841209'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Registered Parcel:</span>
                      <strong className="text-slate-900">
                        {selectedCase.field_id} (Survey {selectedCase.survey_no})
                      </strong>
                      <span className="block text-slate-600 text-[11px]">
                        {selectedCase.crop} • {selectedCase.area_acres} Acres
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Climate Incident:</span>
                      <strong className="text-slate-900">{selectedCase.weather_event}</strong>
                      <span className="block text-slate-600 text-[11px]">Date: {selectedCase.event_date}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[11px]">Evidence Quality Badge:</span>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                        {selectedCase.evidence_quality}
                      </span>
                    </div>
                  </div>

                  {/* Dual Scientific Sources Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-sky-900">
                        <CloudRain className="w-4 h-4 text-sky-600" />
                        <span>Open-Meteo Historical Archive</span>
                      </div>
                      <div className="text-slate-700 space-y-1">
                        <div>
                          Cumulative Rainfall:{' '}
                          <strong className="font-mono">{selectedCase.rainfall_mm ?? 'Pending'} mm</strong>
                        </div>
                        <div>
                          Peak Daily Rain:{' '}
                          <strong className="font-mono">{selectedCase.peak_daily_rainfall_mm ?? 'N/A'} mm</strong>
                        </div>
                        <div>
                          Max Temperature:{' '}
                          <strong className="font-mono">{selectedCase.max_temp_c ?? 'N/A'} °C</strong>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                        <Satellite className="w-4 h-4 text-emerald-600" />
                        <span>Copernicus Sentinel-2 L2A</span>
                      </div>
                      <div className="text-slate-700 space-y-1">
                        <div>
                          Pre NDVI ({selectedCase.pre_obs_date || 'N/A'}):{' '}
                          <strong className="font-mono">{selectedCase.ndvi_before ?? 'N/A'}</strong>
                        </div>
                        <div>
                          Post NDVI ({selectedCase.post_obs_date || 'N/A'}):{' '}
                          <strong className="font-mono">{selectedCase.ndvi_after ?? 'N/A'}</strong>
                        </div>
                        <div>
                          Net Change:{' '}
                          <strong className="font-mono text-red-600">
                            {selectedCase.ndvi_change !== null
                              ? `${selectedCase.ndvi_change} (${selectedCase.ndvi_drop_pct}%)`
                              : 'Weather-Only'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scientific Limitations & Findings Box */}
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-amber-950 space-y-1">
                    <span className="font-bold block flex items-center gap-1 text-amber-900">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                      Preliminary Assessment & Institutional Limitations Notice:
                    </span>
                    <p className="leading-relaxed">
                      {selectedCase.assessment_result || 'Pending Agent 1 assessment.'}
                    </p>
                    <p className="text-[11px] text-amber-800 italic pt-1">
                      {selectedCase.limitations || 'Optical NDVI decline represents vegetation stress. Final yield determination requires authorized field inspection.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: AI Claim Document */}
              {activeTab === 'document' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Document Type: <strong>{selectedCase.document_type}</strong>
                    </span>
                    <span>
                      Model: <strong>{selectedCase.ai_model_used || 'Deterministic Template'}</strong>
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                    {selectedCase.ai_draft || selectedCase.assessment_result || 'Draft pending generation.'}
                  </pre>
                </div>
              )}

              {/* Tab 3: Append-Only Audit Trail (Priority 5) */}
              {activeTab === 'audit' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="text-xs text-slate-500">
                    Immutable event log of all farmer filings, AI agent calculations, and reviewer notes:
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3">Actor</th>
                          <th className="py-2 px-3">Action</th>
                          <th className="py-2 px-3">Event Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditTrail.map((ev) => (
                          <tr key={ev.id} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                              {ev.timestamp}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">
                              {ev.actor}
                            </td>
                            <td className="py-2 px-3 font-semibold text-[#153E32] whitespace-nowrap">
                              {ev.action}
                            </td>
                            <td className="py-2 px-3 text-slate-600">{ev.details}</td>
                          </tr>
                        ))}
                        {auditTrail.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400">
                              No audit trail events recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Reviewer Determination Suite (Priority 4) */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-[#153E32]">
                  Record Review Determination & Officer Decision
                </h3>

                {/* Quick Determination Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleQuickApprove}
                    className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Claim</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleQuickRequestInfo}
                    className="py-2 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Request Additional Info</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('Under Review', 'Field inspection scheduled with Mandal Agricultural Officer (MAO).')}
                    className="py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Schedule Field Inspection</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Set Status:
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="Additional Info Requested">Additional Info Requested</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-slate-600 font-semibold mb-1">
                      Reviewer Notes & Verification Comments:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentsInput}
                        onChange={(e) => setCommentsInput(e.target.value)}
                        placeholder="Enter official institutional comments..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleUpdateStatus()}
                        className="px-4 py-2 rounded-xl bg-[#153E32] hover:bg-[#204E3D] text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-2xs shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{saving ? 'Saving...' : 'Save Decision'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {saveMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveMessage}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select a case from the list on the left to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
