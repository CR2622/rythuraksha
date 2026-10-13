/**
 * RythuRaksha AI: Professional Landing Page (LandingPage.tsx)
 * Priority 1: Premium Fintech Design (#153E32 Forest Green, #3B7C61 Sage, #F5F3EA Warm Ivory)
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
  MapPin,
  FileCheck,
  Award,
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
      {/* Hero Banner with Forest Green & Warm Ivory highlights */}
      <section className="bg-gradient-to-br from-[#153E32] via-[#204E3D] to-[#0E2A22] text-white rounded-3xl p-8 md:p-12 shadow-xl border border-[#3B7C61]/30">
        <div className="max-w-4xl space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-emerald-200">
            <Sprout className="w-4 h-4 text-emerald-300" />
            <span>VNR VJIET AI Engineering Hackathon • Team 33</span>
            <span className="opacity-60">•</span>
            <span>Dual-Portal Tri-Agent MVP</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            RythuRaksha AI{' '}
            <span className="text-emerald-300 font-normal text-2xl md:text-4xl block mt-1.5 font-sans">
              రైతు రక్ష AI — Climate-Smart Crop Insurance & Loan Assistant
            </span>
          </h1>

          <p className="text-sm md:text-base text-emerald-100/90 max-w-3xl leading-relaxed">
            An evidence-backed agricultural intelligence and fintech platform connecting Telangana farmers
            and financial institutions through real <strong>Open-Meteo ERA5</strong> weather reanalysis,
            verified <strong>Sentinel-2 NDVI</strong> canopy observations,{' '}
            <strong>Hugging Face</strong> claim & loan-relief drafting, an immutable{' '}
            <strong>Evidence Passport</strong>, and accessible{' '}
            <strong>Telugu AI (తెలుగు AI)</strong> voice & text assistance.
          </p>

          {/* Primary Portal Entry Buttons */}
          <div className="pt-3 flex flex-wrap gap-3.5">
            <Link
              to="/farmer"
              className="px-6 py-3.5 rounded-xl bg-white text-[#153E32] font-black text-sm shadow-md hover:bg-emerald-50 transition flex items-center gap-2 active:scale-98"
            >
              <Sprout className="w-5 h-5 text-[#153E32]" />
              <span>Enter Farmer Portal (రైతు పోర్టల్)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/institution"
              className="px-6 py-3.5 rounded-xl bg-[#3B7C61] hover:bg-[#316952] text-white border border-emerald-400/30 font-bold text-sm transition flex items-center gap-2 shadow-md active:scale-98"
            >
              <Building2 className="w-5 h-5 text-emerald-200" />
              <span>Enter Bank & Insurer Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live System Health Strip */}
          <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 border-t border-white/15">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Core Engine:{' '}
              <strong className="text-white">Active (Dual-Portal Tri-Agent)</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Primary AI:{' '}
              <strong className="text-white">
                {health?.hf_configured
                  ? `Active (${health.hf_model})`
                  : 'Configured with High-Precision Fallback'}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Cadastre:{' '}
              <strong className="text-white">Telangana Agricultural Boundaries</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Tri-Agent Architecture Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#153E32]">
              Tri-Agent Architecture & Evidence Framework
            </h2>
            <p className="text-xs text-slate-600">
              Three coordinated AI agents ensuring authentic evidence, institutional documentation, and multilingual farmer trust.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Agent 1 Card */}
          <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-6 shadow-sm space-y-3.5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#153E32] flex items-center justify-center font-bold">
              <CloudRain className="w-5 h-5 text-[#153E32]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B7C61]">
                Agent 1
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Crop Damage Intelligence
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Fetches historical Open-Meteo precipitation measurements and Sentinel-2 L2A Red (B4) and NIR (B8) bands to compute canopy NDVI drop without fabricating environmental data.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#153E32]">
              <span>Open-Meteo + Sentinel-2</span>
              <Link to="/analysis" className="hover:underline flex items-center gap-1">
                View Analysis →
              </Link>
            </div>
          </div>

          {/* Agent 2 Card */}
          <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-6 shadow-sm space-y-3.5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#153E32] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-[#153E32]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B7C61]">
                Agent 2
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Financial Claim & Loan Assistant
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Generates formal agricultural insurance claim drafts and loan relief rescheduling requests using Hugging Face LLM strictly grounded on verified facts, with in-line editing and PDF export.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#153E32]">
              <span>Hugging Face Inference</span>
              <Link to="/claim" className="hover:underline flex items-center gap-1">
                Draft Claim →
              </Link>
            </div>
          </div>

          {/* Agent 3 Card */}
          <div className="bg-white rounded-2xl border border-[#3B7C61]/25 p-6 shadow-sm space-y-3.5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#153E32] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-[#153E32]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#3B7C61]">
                Agent 3
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                తెలుగు రైతు సహాయకుడు (Telugu AI)
              </h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Provides real-time Telugu text and voice explanations grounded on live case records, status retrieval, browser speech synthesis audio playback, and microphone speech recognition.
            </p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-[#153E32]">
              <span>Bilingual Telugu + English</span>
              <Link to="/farmer" className="hover:underline flex items-center gap-1">
                Open Assistant →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights: Evidence Passport & Telangana Maps */}
      <section className="bg-white rounded-3xl border border-[#3B7C61]/25 p-8 shadow-sm space-y-6">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#3B7C61]">
            Institutional Grade Integrity
          </span>
          <h2 className="text-2xl font-black text-[#153E32]">
            Evidence Passport & Cadastral Mapping Highlights
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Designed for transparent loss documentation complying with state norms and bank verification workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-[#153E32]/5 border border-[#3B7C61]/20 space-y-2">
            <div className="font-bold text-[#153E32] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#3B7C61]" />
              <span>Immutable Evidence Passport</span>
            </div>
            <p className="text-slate-600">
              Each claim receives an Evidence Passport tying GPS cadastral coordinates, Open-Meteo precipitation logs, Sentinel-2 spectral indices, and an append-only audit trail.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#153E32]/5 border border-[#3B7C61]/20 space-y-2">
            <div className="font-bold text-[#153E32] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#3B7C61]" />
              <span>Telangana Agricultural Boundaries</span>
            </div>
            <p className="text-slate-600">
              Parcel selection restricted to Telangana districts (Warangal, Khammam, Karimnagar, etc.) with coordinates validation preventing out-of-boundary registrations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#153E32]/5 border border-[#3B7C61]/20 space-y-2">
            <div className="font-bold text-[#153E32] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#3B7C61]" />
              <span>Standard-Compliant Dossier PDF</span>
            </div>
            <p className="text-slate-600">
              Single-click generation of verified claim reports ready for print or submission to banks, insurance underwriters, and Mandal Agricultural Officers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
