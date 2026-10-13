/**
 * Agent 2: Insurance Claim & Loan Relief Generator (ClaimPage.tsx)
 * Priority 6: Hugging Face drafting, editable review, save draft, download PDF, submit to bank.
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
  Edit3,
  Save,
  Eye,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  CaseRecord,
  fetchCases,
  fetchSingleCase,
  generateClaimDraft,
  updateClaimDraft,
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

  // Editable draft state
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const loadData = async (cid: string) => {
    try {
      const [casesList, c] = await Promise.all([fetchCases(), fetchSingleCase(cid)]);
      setAllCases(casesList.cases || []);
      setCurrentCase(c);
      if (c?.document_type) {
        setDocType(c.document_type);
      }
      setDraftContent(c?.ai_draft || '');
    } catch {
      // Handled gracefully
    }
  };

  useEffect(() => {
    loadData(caseIdParam);
    setIsEditing(false);
    setSaveBanner(null);
  }, [caseIdParam]);

  const handleGenerate = async (type: 'INSURANCE_CLAIM' | 'LOAN_RELIEF') => {
    if (!currentCase) return;
    setDocType(type);
    setGenerating(true);
    setSubmitBanner(null);
    setSaveBanner(null);
    try {
      const res = await generateClaimDraft(currentCase.case_id, type);
      setCurrentCase(res.case);
      setDraftContent(res.ai_draft);
      setIsEditing(false);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentCase) return;
    setSavingDraft(true);
    setSaveBanner(null);
    try {
      const res = await updateClaimDraft(currentCase.case_id, draftContent, docType);
      setCurrentCase(res.case);
      setIsEditing(false);
      setSaveBanner('Draft modifications saved successfully and logged in Evidence Dossier!');
      setTimeout(() => setSaveBanner(null), 5000);
    } finally {
      setSavingDraft(false);
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
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3B7C61]">
            <Sparkles className="w-4 h-4 text-[#153E32]" />
            <span>Agent 2 • Financial AI Assistant (Hugging Face / Precision Engine)</span>
          </div>
          <h1 className="text-xl font-bold text-[#153E32] mt-1">
            Agricultural Insurance Claim & Loan Relief Documentation
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            రైతు బీమా క్లెయిమ్ & వ్యవసాయ రుణ ఉపశమనం పత్రాలు • Grounded on verified satellite & weather evidence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={caseIdParam}
            onChange={(e) => setSearchParams({ case_id: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#153E32] focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
          >
            {allCases.map((c) => (
              <option key={c.case_id} value={c.case_id}>
                {c.case_id} — {c.crop} ({c.field_id})
              </option>
            ))}
          </select>

          <Link
            to="/institution"
            className="px-3.5 py-2 rounded-xl bg-[#153E32] hover:bg-[#204E3D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Building2 className="w-4 h-4 text-emerald-300" />
            <span>Bank Portal</span>
          </Link>
        </div>
      </div>

      {/* Submission Confirmation Alert */}
      {submitBanner && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{submitBanner}</span>
          </div>
          <Link
            to="/institution"
            className="px-3.5 py-1.5 rounded-lg bg-[#153E32] text-white font-bold hover:bg-[#204E3D] shadow-2xs"
          >
            Review in Bank Portal →
          </Link>
        </div>
      )}

      {/* Save Draft Feedback Alert */}
      {saveBanner && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Case Facts & Action Suite */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#153E32] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3B7C61]" />
              <span>Verified Case Record ({currentCase?.case_id || 'RR001'})</span>
            </h2>

            {currentCase && (
              <div className="text-xs space-y-2 text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">రైతు (Farmer):</span>
                  <strong>{currentCase.farmer_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">పొలం (Field):</span>
                  <strong>
                    {currentCase.field_id} ({currentCase.survey_no})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">పంట & విస్తీర్ణం:</span>
                  <strong>
                    {currentCase.crop} ({currentCase.area_acres} Acres)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">విపత్తు (Event):</span>
                  <strong>
                    {currentCase.weather_event} ({currentCase.event_date})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">వర్షపాతం (Rainfall):</span>
                  <strong className="font-mono">
                    {currentCase.rainfall_mm !== null
                      ? `${currentCase.rainfall_mm} mm`
                      : 'Pending'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NDVI Before:</span>
                  <strong className="font-mono">
                    {currentCase.ndvi_before !== null
                      ? currentCase.ndvi_before.toFixed(4)
                      : 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NDVI After:</span>
                  <strong className="font-mono">
                    {currentCase.ndvi_after !== null
                      ? currentCase.ndvi_after.toFixed(4)
                      : 'N/A'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NDVI Net Drop:</span>
                  <strong className="font-mono text-red-600">
                    {currentCase.ndvi_change !== null
                      ? `${currentCase.ndvi_change.toFixed(4)} (${currentCase.ndvi_drop_pct}%)`
                      : 'Weather-Only'}
                  </strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">ప్రస్తుత స్థితి (Status):</span>
                  <strong className="text-[#153E32]">{currentCase.status}</strong>
                </div>
              </div>
            )}

            {/* Document Generation & Action Suite */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate('INSURANCE_CLAIM')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs ${
                  docType === 'INSURANCE_CLAIM'
                    ? 'bg-[#153E32] text-white hover:bg-[#204E3D]'
                    : 'bg-[#153E32]/5 text-[#153E32] border border-[#3B7C61]/30 hover:bg-[#153E32]/10'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span>
                  {generating && docType === 'INSURANCE_CLAIM'
                    ? 'Drafting Claim via Hugging Face...'
                    : '1. Generate Insurance Claim'}
                </span>
              </button>

              <button
                type="button"
                disabled={generating}
                onClick={() => handleGenerate('LOAN_RELIEF')}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs ${
                  docType === 'LOAN_RELIEF'
                    ? 'bg-[#153E32] text-white hover:bg-[#204E3D]'
                    : 'bg-[#153E32]/5 text-[#153E32] border border-[#3B7C61]/30 hover:bg-[#153E32]/10'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>
                  {generating && docType === 'LOAN_RELIEF'
                    ? 'Drafting Relief via Hugging Face...'
                    : '2. Generate Loan Relief Request'}
                </span>
              </button>

              {currentCase && (
                <a
                  href={getClaimPdfUrl(currentCase.case_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Download className="w-4 h-4 text-[#153E32]" />
                  <span>3. Download PDF Dossier</span>
                </a>
              )}

              <button
                type="button"
                disabled={submitting || !currentCase}
                onClick={handleSubmitToInstitution}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : '4. Submit for Institutional Review'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI-Generated Document Viewer & Editor */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-[#153E32] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#3B7C61]" />
                  <span>
                    {docType === 'LOAN_RELIEF'
                      ? 'Agricultural Crop Loan Relief Request Draft'
                      : 'Agricultural Crop Insurance Claim Draft'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI Model:{' '}
                  <strong className="text-[#153E32]">
                    {currentCase?.ai_model_used || 'Ready to draft via Hugging Face'}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentCase?.ai_draft && (
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="px-3 py-1.5 rounded-lg border border-[#3B7C61]/40 text-[#153E32] hover:bg-[#3B7C61]/10 text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {isEditing ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Mode</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Draft (సవరించండి)</span>
                      </>
                    )}
                  </button>
                )}

                {isEditing && (
                  <button
                    type="button"
                    disabled={savingDraft}
                    onClick={handleSaveDraft}
                    className="px-3.5 py-1.5 rounded-lg bg-[#153E32] text-white hover:bg-[#204E3D] text-xs font-bold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingDraft ? 'Saving...' : 'Save Draft (సేవ్)'}</span>
                  </button>
                )}

                {currentCase && (
                  <a
                    href={getClaimPdfUrl(currentCase.case_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </a>
                )}
              </div>
            </div>

            {generating ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#153E32] animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  Agent 2 is synthesizing verified meteorological & satellite facts...
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Strictly using Open-Meteo rainfall and Copernicus Sentinel-2 NDVI canopy evidence. Never inventing policy numbers or payout amounts.
                </p>
              </div>
            ) : isEditing ? (
              <div className="mt-4 space-y-2">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    You are editing this claim draft. Modifications will be persisted to the database and included in the bank reviewer dossier.
                  </span>
                </div>
                <textarea
                  rows={18}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#3B7C61] leading-relaxed"
                />
              </div>
            ) : currentCase?.ai_draft ? (
              <pre className="mt-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto">
                {currentCase.ai_draft}
              </pre>
            ) : (
              <div className="my-14 p-10 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[#3B7C61] mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  No AI Document Draft Generated Yet for {currentCase?.case_id}
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Click <strong>"1. Generate Insurance Claim"</strong> or{' '}
                  <strong>"2. Generate Loan Relief Request"</strong> on the left to create an evidence-backed formal document.
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
