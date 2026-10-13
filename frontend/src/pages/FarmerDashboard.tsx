/**
 * Developer 1 Module: Farmer Portal Dashboard (FarmerDashboard.tsx)
 * Implements CP-02 Farmer Portal Sections:
 * - Farmer's name (demo account), Registered field, Crop type, Current cases
 * - Interactive Leaflet FieldMap selection
 * - New damage report form & button
 * - Embedded / shortcut Telugu Assistant (Agent 3)
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

  // New Incident Report Form State
  const [weatherEvent, setWeatherEvent] = useState('Heavy rainfall');
  const [eventDate, setEventDate] = useState('2024-09-01');
  const [farmerNotes, setFarmerNotes] = useState(
    'Heavy monsoon depression caused waterlogging in standing crop parcel.'
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
    cases[0];

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('approved')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (s.includes('under')) {
      return 'bg-blue-100 text-blue-800 border-blue-300';
    }
    if (s.includes('reject') || s.includes('inspection')) {
      return 'bg-red-100 text-red-800 border-red-300';
    }
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Farmer Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold text-lg">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                Demo Farmer Account
              </span>
              <span className="text-xs text-slate-500">
                Pattadar Passbook: {selectedField?.pattadar_passbook || 'PPB-TS-8841209'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {selectedField?.farmer_name || 'B. Ramesh Goud'}{' '}
              <span className="text-forest-800 font-normal text-base">
                ({selectedField?.farmer_name_te || 'బి. రమేష్ గౌడ్'})
              </span>
            </h1>
            <p className="text-xs text-slate-600 flex flex-wrap items-center gap-3 mt-0.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                {selectedField?.village || 'Duggondi'},{' '}
                {selectedField?.district || 'Warangal, Telangana'}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-forest-700" />
                Registered Field: <strong>{selectedField?.field_id || 'FIELD001'}</strong> (
                {selectedField?.crop || 'Paddy'} — {selectedField?.area_acres || 4.2} Acres)
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTeluguPanel(!showTeluguPanel)}
            className="px-4 py-2.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-300 text-xs font-bold transition flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-forest-700" />
            {showTeluguPanel ? 'Hide Telugu AI Assistant' : 'తెలుగు AI సహాయకుడు (Agent 3)'}
          </button>

          <Link
            to={`/analysis?case_id=${activeCase?.case_id || 'RR001'}`}
            className="px-4 py-2.5 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Activity className="w-4 h-4" />
            Open Damage Analysis (Agent 1)
          </Link>
        </div>
      </div>

      {/* Collapsible Embedded Telugu Assistant */}
      {showTeluguPanel && (
        <TeluguAssistant
          caseId={activeCase?.case_id || 'RR001'}
          embedded={true}
        />
      )}

      {/* Main Grid: Interactive Field Selection Map + Report Weather Event Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <FieldMap
            fields={fields}
            selectedFieldId={selectedField?.field_id || 'FIELD001'}
            onSelectField={handleSelectField}
            height="370px"
          />
        </div>

        {/* Report Crop Damage Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-forest-800 font-bold text-sm mb-1">
              <PlusCircle className="w-5 h-5" />
              <span>Report Crop Damage Event</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select your field boundary on the map and log the weather incident to trigger Agent 1
              verification.
            </p>

            <form id="incident-form" onSubmit={handleReportDamage} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selected Field & Crop
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedField?.field_id || 'FIELD001'} — ${
                    selectedField?.crop || 'Paddy'
                  } (${selectedField?.area_acres || 4.2} Acres, Survey ${
                    selectedField?.survey_no || 'SY-114/A'
                  })`}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Weather Event Type
                </label>
                <select
                  value={weatherEvent}
                  onChange={(e) => setWeatherEvent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                >
                  <option value="Heavy rainfall">Heavy rainfall (భారీ వర్షపాతం)</option>
                  <option value="Flood & Submergence">Flood & Submergence (వరద ముంపు)</option>
                  <option value="Unseasonal Monsoon Downpour">
                    Unseasonal Monsoon Downpour (అకాల వర్షం)
                  </option>
                  <option value="Cyclonic Gale Winds">Cyclonic Gale Winds (తుఫాను గాలులు)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Historical Event Date (Telangana Monsoon Window)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Recommended verified event date: 2024-09-01 (Telangana heavy rain depression)
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Farmer Field Observations
                </label>
                <textarea
                  rows={2}
                  value={farmerNotes}
                  onChange={(e) => setFarmerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:ring-2 focus:ring-forest-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                {submitting
                  ? 'Saving Incident to SQLite...'
                  : 'Create New Damage Report & Run Agent 1'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Current Cases Table (Synchronized with Institution Portal via SQLite) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Current Applications & Case Status (SQLite Synchronized)
            </h2>
            <p className="text-xs text-slate-500">
              Updates made by the Bank / Insurance Reviewer appear here and in the Telugu Assistant immediately.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Cases
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase">
                <th className="py-3 px-4 font-bold">Case ID</th>
                <th className="py-3 px-4 font-bold">Field & Crop</th>
                <th className="py-3 px-4 font-bold">Event & Date</th>
                <th className="py-3 px-4 font-bold">Agent 1 Evidence</th>
                <th className="py-3 px-4 font-bold">Institution Status</th>
                <th className="py-3 px-4 font-bold">Reviewer Comments</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {cases.map((c) => (
                <tr key={c.case_id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-forest-900">{c.case_id}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">
                      {c.crop} ({c.field_id})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {c.farmer_name} • {c.area_acres} Acres
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">{c.weather_event}</div>
                    <div className="text-[11px] text-slate-500">{c.event_date}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div>
                        Rain:{' '}
                        <strong>
                          {c.rainfall_mm !== null ? `${c.rainfall_mm} mm` : 'Pending'}
                        </strong>
                      </div>
                      <div>
                        NDVI Δ:{' '}
                        <strong>
                          {c.ndvi_change !== null ? c.ndvi_change.toFixed(4) : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs text-slate-600">
                    {c.reviewer_comments || 'No comments yet'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/analysis?case_id=${c.case_id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 font-semibold flex items-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Analyze
                      </Link>
                      <Link
                        to={`/claim?case_id=${c.case_id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-forest-800 hover:bg-forest-900 text-white font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Claim / Loan
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                      <a
                        href={getClaimPdfUrl(c.case_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700"
                        title="Download PDF Report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
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
