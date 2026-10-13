/**
 * Farmer Portal Dashboard (FarmerDashboard.tsx)
 * Priority 3: Premium UI, Telangana field selection, bilingual labels, claim workflow, and Telugu AI assistant.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Sprout,
  MapPin,
  PlusCircle,
  FileText,
  Activity,
  MessageSquare,
  RefreshCw,
  ArrowRight,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import FieldMap from '../components/FieldMap';
import TeluguAssistant from '../components/TeluguAssistant';
import {
  CaseRecord,
  FieldItem,
  createIncident,
  fetchCases,
  fetchFields,
  getClaimPdfUrl,
} from '../services/api';

export const FarmerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [selectedField, setSelectedField] = useState<FieldItem | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTeluguPanel, setShowTeluguPanel] = useState(false);

  // Incident reporting state
  const [weatherEvent, setWeatherEvent] = useState('Heavy rainfall');
  const [eventDate, setEventDate] = useState('2024-09-01');
  const [farmerNotes, setFarmerNotes] = useState(
    'Extreme monsoon depression caused severe field waterlogging in standing crop.'
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [fieldsRes, casesRes] = await Promise.all([fetchFields(), fetchCases()]);
      const flist = fieldsRes.fields || [];
      setFields(flist);
      if (!selectedField && flist.length > 0) {
        setSelectedField(flist[0]);
      }
      setCases(casesRes.cases || []);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectField = (field: FieldItem) => {
    setSelectedField(field);
    if (field.default_event_date) {
      setEventDate(field.default_event_date);
    }
  };

  const handleReportDamage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFieldId = selectedField?.field_id || 'FIELD001';
    setSubmitting(true);
    try {
      const res = await createIncident({
        field_id: targetFieldId,
        weather_event: weatherEvent,
        event_date: eventDate,
        farmer_notes: farmerNotes,
        crop: selectedField?.crop,
      });
      navigate(`/analysis?case_id=${res.case.case_id}`);
    } catch {
      navigate(`/analysis?case_id=RR001`);
    } finally {
      setSubmitting(false);
    }
  };

  const activeCase =
    cases.find((c) => c.field_id === (selectedField?.field_id || 'FIELD001')) ||
    cases[0] ||
    null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'COMPLETED':
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ఆమోదించబడింది (Approved)
          </span>
        );
      case 'Under Review':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            పరిశీలనలో ఉంది (Under Review)
          </span>
        );
      case 'Additional Info Requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-300">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            అదనపు వివరాలు కావాలి
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            పెండింగ్‌లో ఉంది (Pending)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Farmer Profile & Passbook Credential */}
      <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#153E32] text-white flex items-center justify-center shadow-md">
              <User className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#153E32]">
                  {selectedField?.farmer_name || 'B. Ramesh Goud'}
                </h1>
                <span className="text-xs text-slate-500 font-medium">
                  ({selectedField?.farmer_name_te || 'బి. రమేష్ గౌడ్'})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                  ధ్రువీకరించబడిన రైతు (Verified Farmer)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-0.5">
                <span>
                  పాస్‌బుక్ (Passbook): <strong>{selectedField?.pattadar_passbook || 'PPB-TS-8841209'}</strong>
                </span>
                <span>
                  మండలం: <strong>{selectedField?.mandal || 'Narsampet'}</strong>
                </span>
                <span>
                  జిల్లా: <strong>{selectedField?.district || 'Warangal, Telangana'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh case data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowTeluguPanel((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-[#153E32] text-white text-xs font-bold shadow-sm hover:bg-[#204E3D] transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>{showTeluguPanel ? 'Hide Assistant' : 'సహాయకుడిని చూపించు'}</span>
            </button>
          </div>
        </div>

        {/* Workflow Steps Indicator */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-xl bg-[#153E32]/5 border border-[#3B7C61]/20">
            <div className="font-bold text-[#153E32] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#153E32] text-white text-[10px] flex items-center justify-center font-bold">1</span>
              <span>పొలం & విపత్తు నమోదు</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Select Telangana parcel & report climate incident.</p>
          </div>

          <Link
            to={activeCase ? `/analysis?case_id=${activeCase.case_id}` : '/analysis'}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#3B7C61]/40 hover:bg-slate-50 transition group"
          >
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">2</span>
                <span>Agent 1 నష్ట విశ్లేషణ</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#153E32]" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Open-Meteo & Sentinel-2 NDVI canopy decline.</p>
          </Link>

          <Link
            to={activeCase ? `/claim?case_id=${activeCase.case_id}` : '/claim'}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#3B7C61]/40 hover:bg-slate-50 transition group"
          >
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">3</span>
                <span>Agent 2 క్లెయిమ్ / లోన్ డ్రాఫ్ట్</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#153E32]" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Hugging Face financial claim & relief document.</p>
          </Link>

          <Link
            to="/institution"
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#3B7C61]/40 hover:bg-slate-50 transition group"
          >
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">4</span>
                <span>బ్యాంకు / బీమా సమర్పణ</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#153E32]" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Institutional verification & dossier review.</p>
          </Link>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Incident Reporting Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Field Selector */}
        <div className="lg:col-span-7 space-y-4">
          <FieldMap
            fields={fields}
            selectedFieldId={selectedField?.field_id || 'FIELD001'}
            onSelectField={handleSelectField}
            height="360px"
          />

          {/* Quick Active Case Summary Box */}
          {activeCase && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#153E32] flex items-center justify-center font-bold">
                  {activeCase.case_id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {activeCase.crop} • {activeCase.weather_event}
                    </span>
                    {getStatusBadge(activeCase.status)}
                  </div>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Reported on: {activeCase.event_date} • Evidence: {activeCase.evidence_quality}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/analysis?case_id=${activeCase.case_id}`}
                  className="px-3 py-1.5 rounded-lg bg-[#153E32] text-white font-bold hover:bg-[#204E3D] transition flex items-center gap-1"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>నష్ట విశ్లేషణ (Agent 1)</span>
                </Link>
                <a
                  href={getClaimPdfUrl(activeCase.case_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                  title="Download Evidence Dossier PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: New Damage Report Form & Telugu Assistant */}
        <div className="lg:col-span-5 space-y-4">
          {showTeluguPanel ? (
            <TeluguAssistant
              caseId={activeCase?.case_id || 'RR001'}
              embedded={true}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#153E32]/10 text-[#153E32] flex items-center justify-center">
                    <PlusCircle className="w-4 h-4 text-[#153E32]" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-[#153E32]">
                      Report Crop Damage Incident
                    </h2>
                    <span className="text-[11px] text-slate-500 block -mt-0.5">
                      పంట నష్టాన్ని నమోదు చేయండి (Climate Event Logging)
                    </span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleReportDamage} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Selected Agricultural Parcel (ఎంపిక చేసిన పొలం)
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 text-sm">
                        {selectedField?.field_id || 'FIELD001'}
                      </strong>
                      <span className="text-slate-500 ml-1.5">
                        ({selectedField?.crop || 'Paddy'} • {selectedField?.area_acres || 4.2} Acres)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedField?.survey_no || 'SY-114/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Weather Event Type (వాతావరణ విపత్తు రకం)
                  </label>
                  <select
                    value={weatherEvent}
                    onChange={(e) => setWeatherEvent(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61] font-medium"
                  >
                    <option value="Heavy rainfall">Heavy rainfall (భారీ వర్షపాతం / వరదలు)</option>
                    <option value="Flash flood & Inundation">Flash flood & Inundation (ఆకస్మిక వరద / ముంపు)</option>
                    <option value="Hailstorm & Gusts">Hailstorm & Gusts (వడగండ్ల వాన)</option>
                    <option value="Severe Drought">Severe Drought (తీవ్ర కరువు / వర్షాభావం)</option>
                    <option value="Pest Infestation post-rain">Pest Infestation (తెగుళ్ల ఉధృతి)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Event Date (విపత్తు సంభవించిన తేదీ)
                  </label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Farmer Field Notes (రైతు పరిశీలనలు & వివరాలు)
                  </label>
                  <textarea
                    rows={3}
                    value={farmerNotes}
                    onChange={(e) => setFarmerNotes(e.target.value)}
                    placeholder="పంటపై పడిన ప్రభావం గురించి వివరించండి (నీరు నిల్వ ఉండటం, ఒంగిపోవడం మొదలైనవి)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#3B7C61]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-[#153E32] hover:bg-[#204E3D] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>
                    {submitting
                      ? 'నమోదు చేయబడుతోంది...'
                      : 'Record Incident & Launch Agent 1 Analysis'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Submitted Cases History Table */}
      <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-[#153E32]">
              Farmer Case Records & Institutional Status Tracker
            </h2>
            <p className="text-[11px] text-slate-500">
              మీ సమర్పించిన దరఖాస్తుల స్థితి & పురోగతి (Real-time synchronization with Bank Portal)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            Total Requests: {cases.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Crop (పంట)</th>
                <th className="py-2.5 px-3">Incident (విపత్తు)</th>
                <th className="py-2.5 px-3">Rainfall (mm)</th>
                <th className="py-2.5 px-3">NDVI Change</th>
                <th className="py-2.5 px-3">Official Status</th>
                <th className="py-2.5 px-3">Reviewer Note</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => (
                <tr key={c.case_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-[#153E32]">{c.case_id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{c.crop}</td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {c.weather_event} <span className="text-slate-400">({c.event_date})</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {c.rainfall_mm !== null ? `${c.rainfall_mm} mm` : 'Pending'}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {c.ndvi_change !== null ? (
                      <span className="text-red-600 font-bold">{c.ndvi_change}</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(c.status)}</td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={c.reviewer_comments || ''}>
                    {c.reviewer_comments || 'Awaiting initial review.'}
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                    <Link
                      to={`/analysis?case_id=${c.case_id}`}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-[#153E32] hover:text-white text-slate-700 text-[11px] font-semibold transition"
                    >
                      Analysis
                    </Link>
                    <Link
                      to={`/claim?case_id=${c.case_id}`}
                      className="px-2 py-1 rounded bg-[#153E32] text-white text-[11px] font-semibold hover:bg-[#204E3D] transition"
                    >
                      Draft
                    </Link>
                    <a
                      href={getClaimPdfUrl(c.case_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 rounded border border-slate-300 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
