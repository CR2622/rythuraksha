/**
 * Developer 1 & 4 Module: Main Application Shell & Router (App.tsx)
 * Connects both portals (Farmer Portal & Institutional Reviewer Portal)
 * and provides persistent access to Agent 3 (Telugu AI Assistant).
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
    `px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
      isActive
        ? 'bg-forest-800 text-white shadow-sm'
        : 'text-slate-700 hover:bg-forest-50 hover:text-forest-900'
    }`;

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-forest-800 text-white flex items-center justify-center shadow-sm">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base text-forest-900 tracking-tight">
                  RythuRaksha AI
                </span>
                <span className="block text-[10px] font-semibold text-slate-500 -mt-0.5">
                  Team 33 • Dual-Portal Tri-Agent MVP
                </span>
              </div>
            </NavLink>

            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center gap-1.5">
              <NavLink to="/" end className={navLinkClass}>
                <Home className="w-3.5 h-3.5" />
                Overview
              </NavLink>
              <NavLink to="/farmer" className={navLinkClass}>
                <Sprout className="w-3.5 h-3.5" />
                Farmer Portal
              </NavLink>
              <NavLink to="/analysis" className={navLinkClass}>
                <Activity className="w-3.5 h-3.5" />
                Agent 1: Damage Analysis
              </NavLink>
              <NavLink to="/claim" className={navLinkClass}>
                <FileText className="w-3.5 h-3.5" />
                Agent 2: Claim & Loan
              </NavLink>
              <NavLink to="/institution" className={navLinkClass}>
                <Building2 className="w-3.5 h-3.5" />
                Bank / Insurer Portal
              </NavLink>
            </nav>

            {/* Agent 3 Telugu Assistant Shortcut Button */}
            <button
              type="button"
              onClick={() => setTeluguModalOpen((prev) => !prev)}
              className="px-3.5 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-green-300" />
              <span>తెలుగు సహాయకుడు (Agent 3)</span>
            </button>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
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
        <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              <strong>RythuRaksha AI</strong> — VNR VJIET AI Engineering Hackathon (Team 33)
            </span>
            <span>
              Scientific Note: AI provides preliminary environmental assessment & documentation;
              final claim decisions require authorized institutional verification.
            </span>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
