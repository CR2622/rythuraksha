/**
 * Developer 1 Module: Professional Landing Page (LandingPage.tsx)
 * Showcases the Dual-Portal Tri-Agent Architecture for Team 33 (VNR VJIET Hackathon).
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  ShieldCheck,
  Satellite,
  FileText,
  MessageSquare,
  Building2,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Database,
} from 'lucide-react';
import { checkBackendHealth } from '../services/api';

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    checkBackendHealth()
      .then((data) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-forest-900 via-forest-800 to-emerald-900 text-white rounded-2xl p-8 md:p-12 shadow-lg">
        <div className="max-w-4xl space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-green-100">
            <Sprout className="w-4 h-4 text-green-300" />
            <span>VNR VJIET AI Engineering Hackathon • Team 33</span>
            <span className="opacity-60">|</span>
            <span>Dual-Portal + Tri-Agent Architecture</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            RythuRaksha AI{' '}
            <span className="text-green-300 font-normal text-2xl md:text-4xl block mt-1">
              రైతు రక్ష AI — Climate-Smart Crop Insurance & Loan Assistant
            </span>
          </h1>

          <p className="text-sm md:text-base text-green-100 max-w-3xl leading-relaxed">
            An evidence-backed agricultural intelligence platform connecting Telangana farmers and
            financial institutions through real <strong>Open-Meteo</strong> weather reanalysis,
            verified <strong>Sentinel-2 NDVI</strong> observations,{' '}
            <strong>Hugging Face</strong> claim & loan-relief drafting, and accessible{' '}
            <strong>Telugu AI</strong> assistance.
          </p>

          {/* Primary Portal Entry Buttons */}
          <div className="pt-3 flex flex-wrap gap-4">
            <Link
              to="/farmer"
              className="px-6 py-3.5 rounded-xl bg-white text-forest-900 font-bold text-sm shadow-md hover:bg-green-50 transition flex items-center gap-2"
            >
              <Sprout className="w-5 h-5 text-forest-700" />
              Enter Farmer Portal (రైతు పోర్టల్)
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/institution"
              className="px-6 py-3.5 rounded-xl bg-forest-700/80 hover:bg-forest-700 text-white border border-green-400/30 font-bold text-sm transition flex items-center gap-2"
            >
              <Building2 className="w-5 h-5 text-green-300" />
              Enter Bank / Insurer Reviewer Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live System Health Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-green-200 border-t border-white/15">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Backend API:{' '}
              <strong>{health ? 'Connected (FastAPI + SQLite)' : 'Ready to connect'}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-4 h-4 text-green-400" />
              Hugging Face LLM:{' '}
              <strong>
                {health?.hf_configured
                  ? `Active (${health.hf_model})`
                  : 'Configured with Fallback Protection'}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Tri-Agent Architecture Cards */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Cooperating Tri-Agent AI System
            </h2>
            <p className="text-xs text-slate-600">
              All three agents share a single SQLite source of truth across Farmer and Institution portals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center">
              <Satellite className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
              Agent 1 • Crop Damage Intelligence
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Real Weather + Verified Sentinel-2 NDVI
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Retrieves historical precipitation and max temperature from{' '}
              <strong>Open-Meteo</strong> and calculates canopy vegetation change{' '}
              <code>NDVI = (B8 − B4) / (B8 + B4)</code> from documented Sentinel-2 observations
              without fabricating measurements.
            </p>
            <Link
              to="/analysis"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:underline pt-1"
            >
              Open Damage Analysis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Agent 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
              Agent 2 • Financial Documentation AI
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Hugging Face Claim & Loan Relief Drafts
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Converts saved database evidence into formal{' '}
              <strong>Crop Insurance Claims</strong> and{' '}
              <strong>Loan Relief Requests</strong> using Hugging Face{' '}
              <code>InferenceClient</code> and exports a downloadable <strong>ReportLab PDF</strong>.
            </p>
            <Link
              to="/claim"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:underline pt-1"
            >
              Open Claim & PDF Generator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Agent 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-forest-700">
              Agent 3 • Telugu Farmer Assistant
            </div>
            <h3 className="text-base font-bold text-slate-900">
              తెలుగు రైతు సహాయకుడు (Text + Voice)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explains crop condition, live institutional claim status, and loan-relief steps in
              simple Telugu grounded on the SQLite case record, supporting browser{' '}
              <code>te-IN</code> speech recognition and synthesis.
            </p>
            <Link
              to="/farmer"
              className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:underline pt-1"
            >
              Try Telugu Assistant <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* End-to-End Hackathon Workflow Stepper */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-forest-700" />
            End-to-End Synchronized Workflow (Farmer ↔ Bank/Insurer)
          </h2>
          <span className="text-xs text-slate-500">Shared SQLite Persistence</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            {
              step: 'Step 1',
              title: 'Select Field & Report',
              desc: 'Farmer selects verified Telangana field (FIELD001) & reports heavy rainfall.',
              to: '/farmer',
            },
            {
              step: 'Step 2',
              title: 'Agent 1 Damage Analysis',
              desc: 'Loads real Open-Meteo rainfall + Sentinel-2 B8/B4 NDVI change.',
              to: '/analysis',
            },
            {
              step: 'Step 3',
              title: 'Agent 2 Claim & PDF',
              desc: 'Hugging Face generates Insurance or Loan Relief draft + ReportLab PDF.',
              to: '/claim',
            },
            {
              step: 'Step 4',
              title: 'Institutional Review',
              desc: 'Reviewer inspects evidence & updates status (Under Review / Completed).',
              to: '/institution',
            },
            {
              step: 'Step 5',
              title: 'Agent 3 Telugu Update',
              desc: 'Farmer asks in Telugu and hears live updated status & reviewer notes.',
              to: '/farmer',
            },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={item.to}
              className="p-3.5 rounded-lg bg-forest-50/70 hover:bg-forest-100/80 border border-forest-200 transition flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-bold text-forest-700 uppercase">
                  {item.step}
                </div>
                <div className="font-bold text-slate-900 mt-0.5">{item.title}</div>
                <p className="text-slate-600 mt-1 leading-snug">{item.desc}</p>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-forest-800 flex items-center gap-1">
                Go to screen <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
