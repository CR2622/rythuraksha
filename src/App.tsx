/**
 * RythuRaksha AI: Main Application Shell & Navigation
 * Dual-Portal Tri-Agent Agricultural Fintech Platform (VNR VJIET Team 33)
 */

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  Sprout,
  Activity,
  FileText,
  Building2,
  MessageSquare,
  Home,
  Shield,
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import DamageAnalysis from './pages/DamageAnalysis';
import ClaimPage from './pages/ClaimPage';
import InstitutionDashboard from './pages/InstitutionDashboard';
import TeluguAssistant from './components/TeluguAssistant';

export const App: React.FC = () => {
  const [teluguModalOpen, setTeluguModalOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
      isActive
        ? 'bg-[#153E32] text-white shadow-sm ring-1 ring-[#3B7C61]/30'
        : 'text-[#153E32] hover:bg-[#3B7C61]/10 hover:text-[#0E2A22]'
    }`;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#F5F3EA] text-slate-900">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#3B7C61]/20 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-[#153E32] text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <Sprout className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-[#153E32] tracking-tight">
                    RythuRaksha AI
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3B7C61]/15 text-[#153E32]">
                    రైతు రక్ష
                  </span>
                </div>
                <span className="block text-[10px] font-medium text-slate-500 -mt-0.5">
                  Climate-Smart Crop Insurance & Loan Assistant • Team 33
                </span>
              </div>
            </NavLink>

            {/* Navigation Links */}
            <nav className="hidden md:flex flex-wrap items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                <Home className="w-3.5 h-3.5" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/farmer" className={navLinkClass}>
                <Sprout className="w-3.5 h-3.5" />
                <span>Farmer Portal</span>
              </NavLink>
              <NavLink to="/analysis" className={navLinkClass}>
                <Activity className="w-3.5 h-3.5" />
                <span>Agent 1: Damage Analysis</span>
              </NavLink>
              <NavLink to="/claim" className={navLinkClass}>
                <FileText className="w-3.5 h-3.5" />
                <span>Agent 2: Claim & Loan</span>
              </NavLink>
              <NavLink to="/institution" className={navLinkClass}>
                <Building2 className="w-3.5 h-3.5" />
                <span>Bank / Insurer Portal</span>
              </NavLink>
            </nav>

            {/* Agent 3 Telugu Assistant Shortcut Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTeluguModalOpen((prev) => !prev)}
                className="px-3.5 py-2 rounded-xl bg-[#153E32] hover:bg-[#204E3D] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 ring-1 ring-[#3B7C61]/30 active:scale-95"
              >
                <div className="relative">
                  <MessageSquare className="w-4 h-4 text-emerald-300" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="hidden sm:inline">తెలుగు సహాయకుడు (Agent 3)</span>
                <span className="sm:hidden">తెలుగు AI</span>
              </button>
            </div>
          </div>

          {/* Mobile sub-navigation bar */}
          <div className="md:hidden flex overflow-x-auto px-4 py-2 bg-white/80 border-t border-slate-100 gap-1.5">
            <NavLink to="/" end className={navLinkClass}>
              <Home className="w-3.5 h-3.5" />
              Overview
            </NavLink>
            <NavLink to="/farmer" className={navLinkClass}>
              <Sprout className="w-3.5 h-3.5" />
              Farmer
            </NavLink>
            <NavLink to="/analysis" className={navLinkClass}>
              <Activity className="w-3.5 h-3.5" />
              Agent 1
            </NavLink>
            <NavLink to="/claim" className={navLinkClass}>
              <FileText className="w-3.5 h-3.5" />
              Agent 2
            </NavLink>
            <NavLink to="/institution" className={navLinkClass}>
              <Building2 className="w-3.5 h-3.5" />
              Bank
            </NavLink>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/analysis" element={<DamageAnalysis />} />
            <Route path="/claim" element={<ClaimPage />} />
            <Route path="/institution" element={<InstitutionDashboard />} />
          </Routes>
        </main>

        {/* Floating Telugu AI Assistant Drawer */}
        <TeluguAssistant
          caseId="RR001"
          isOpen={teluguModalOpen}
          onClose={() => setTeluguModalOpen(false)}
          embedded={false}
        />

        {/* Footer */}
        <footer className="bg-white border-t border-[#3B7C61]/20 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3B7C61]" />
              <span>
                <strong className="text-[#153E32]">RythuRaksha AI</strong> — Climate-Smart Agricultural Verification (VNR VJIET Team 33)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 max-w-xl text-right">
              Scientific Notice: Satellite NDVI & Open-Meteo ERA5 provide preliminary environmental evidence. Official claim settlement requires authorized human verification.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
