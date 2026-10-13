/**
 * Developer 1 & 2 Module: Agent 2 — Insurance Claim & Loan Relief Generator (ClaimPage.tsx)
 * Implements CP-02 & CP-04:
 * - Generate Insurance Claim (via Hugging Face InferenceClient)
 * - Generate Loan Relief Request (via Hugging Face InferenceClient)
 * - Download PDF (via ReportLab /api/claims/{id}/pdf)
 * - Submit for Review (updates status in SQLite so Institution Portal receives it immediately)
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Download,
  Send,
  CheckCircle2,
  Building2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import {
  CaseRecord,
  fetchCases,
  fetchSingleCase,
  generateClaimDraft,
  getClaimPdfUrl,
  submitClaimForReview,
} from '../services/api';

export const ClaimPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get('case_id') || 'RR001';

  const [allCases, setAllCases] = useState<CaseRecord[]>([]);
  const [currentCase, setCurrentCase] = useState<CaseRecord | null>(null);
  const [docType, setDocType] = useState<'INSURANCE_CLAIM' | 'LOAN_RELIEF'>('INSURANCE_CLAIM');
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const loadData = async (cid: string) => {
    try {
      const [casesList, c] = await Promise.all([fetchCases(), fetchSingleCase(cid)]);
      setAllCases(casesList.cases || []);
      setCurrentCase(c);
      if (c?.document_type) {
        setDocType(c.document_type);
      }
    } catch {
      // Handled gracefully
    }
  };

  useEffect(() => {
    loadData(caseIdParam);
  }, [caseIdParam]);

  const handleGenerate = async (type: 'INSURANCE_CLAIM' | 'LOAN_RELIEF') => {
    if (!currentCase) return;
    setDocType(type);
    setGenerating(true);
    setSubmitBanner(null);
    try {
      const res = await generateClaimDraft(currentCase.case_id, type);
      setCurrentCase(res.case);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitToInstitution = async () => {
    if (!currentCase) return;
    setSubmitting(true);
    try {
      const res = await submitClaimForReview(currentCase.case_id);
      setCurrentCase(res.case);
      setSubmitBanner(
        `Case ${res.case.case_id} has been submitted for institutional review! Status is now "${res.case.status}".`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-700">
            <Sparkles className="w-4 h-4" />
            <span>Agent 2 • Hugging Face Financial Documentation AI</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Generate Evidence-Backed Insurance Claim & Loan Relief Drafts
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Uses only verified SQLite assessment facts. Never invents policy details or compensation amounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

          <Link
            to="/institution"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            Open Institution Portal
          </Link>
        </div>
      </div>

      {/* Submission Confirmation Alert */}
      {submitBanner && (
        <div className="p-4 rounded-xl bg-green-50 border border-green-300 text-green-900 text-xs font-semibold flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-700" />
            <span>{submitBanner}</span>
          </div>
          <Link
            to="/institution"
            className="px-3 py-1.5 rounded-lg bg-forest-800 text-white font-bold hover:bg-forest-900"
          >
            Review Case in Bank / Insurer Portal →
          </Link>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Verified Evidence Summary & Action Buttons (CP-02 Section 4) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-700" />
              Saved Case Evidence ({currentCase?.case_id || 'RR001'})
            </h2>

            {currentCase && (
              <div className="text-xs space-y-2 text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer:</span>
                  <strong>{currentCase.farmer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Field & Survey:</span>
                  <strong>
                    {currentCase.field_id} ({currentCase.survey_no})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop & Area:</span>
                  <strong>
                    {currentCase.crop} ({currentCase.area_acres} Acres)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Weather Event:</span>
                  <strong>
                    {currentCase.weather_event} ({currentCase.event_date})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Open-Meteo Rain:</span>
                  <strong>
                    {currentCase.rainfall_mm !== null
                      ? `${currentCase.rainfall_mm} mm`
                      : 'Auto-loads on draft'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sentinel-2 NDVI Before:</span>
                  <strong>
                    {currentCase.ndvi_before !== null
                      ? currentCase.ndvi_before.toFixed(4)
                      : 'Unavailable'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sentinel-2 NDVI After:</span>
                  <strong>
                    {currentCase.ndvi_after !== null
                      ? currentCase.ndvi_after.toFixed(4)
                      : 'Unavailable'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NDVI Change:</span>
                  <strong className="text-red-700">
                    {currentCase.ndvi_change !== null
                      ? currentCase.ndvi_change.toFixed(4)
                      : 'Weather-Only'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Current Status:</span>
                  <strong className="text-forest-800">{currentCase.status}</strong>
                </div>
              </div>
            )}

            {/* 4 Required CP-02 Claim Generation Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate('INSURANCE_CLAIM')}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                  docType === 'INSURANCE_CLAIM'
                    ? 'bg-forest-800 text-white hover:bg-forest-900'
                    : 'bg-forest-50 text-forest-900 border border-forest-300 hover:bg-forest-100'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {generating && docType === 'INSURANCE_CLAIM'
                  ? 'Calling Hugging Face LLM...'
                  : '1. Generate Insurance Claim'}
              </button>

              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate('LOAN_RELIEF')}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm ${
                  docType === 'LOAN_RELIEF'
                    ? 'bg-forest-800 text-white hover:bg-forest-900'
                    : 'bg-forest-50 text-forest-900 border border-forest-300 hover:bg-forest-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                {generating && docType === 'LOAN_RELIEF'
                  ? 'Calling Hugging Face LLM...'
                  : '2. Generate Loan Relief Request'}
              </button>

              {currentCase && (
                <a
                  href={getClaimPdfUrl(currentCase.case_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-forest-700" />
                  3. Download PDF Evidence Report
                </a>
              )}

              <button
                type="button"
                disabled={submitting || !currentCase}
                onClick={handleSubmitToInstitution}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting to SQLite...' : '4. Submit for Institutional Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: AI-Generated Document Viewer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-forest-700" />
                  {currentCase?.document_type === 'LOAN_RELIEF'
                    ? 'Agricultural Crop Loan Relief Request Draft'
                    : 'Agricultural Crop Insurance Claim Draft'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Provider:{' '}
                  <strong className="text-forest-800">
                    {currentCase?.ai_model_used || 'Ready to generate via Hugging Face InferenceClient'}
                  </strong>
                </p>
              </div>

              {currentCase && (
                <a
                  href={getClaimPdfUrl(currentCase.case_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download ReportLab PDF
                </a>
              )}
            </div>

            {generating ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-forest-700 animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Agent 2 is drafting your document via Hugging Face...
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Synthesizing verified Open-Meteo rainfall and Sentinel-2 NDVI observations without
                  fabricating policy numbers or payout figures.
                </p>
              </div>
            ) : currentCase?.ai_draft ? (
              <pre className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[540px] overflow-y-auto">
                {currentCase.ai_draft}
              </pre>
            ) : (
              <div className="my-12 p-10 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-forest-700 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  No AI Claim Draft Generated Yet for {currentCase?.case_id}
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Click <strong>"1. Generate Insurance Claim"</strong> or{' '}
                  <strong>"2. Generate Loan Relief Request"</strong> on the left to generate an
                  evidence-backed draft using Hugging Face.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimPage;
