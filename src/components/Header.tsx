import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  History,
  Coins,
  BrainCircuit,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { CurrencyCode } from '../types/financial';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  savedCount: number;
  onOpenHistory: () => void;
}

const currencies: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: '$', label: 'USD ($)', symbol: '$' },
  { code: '₹', label: 'INR (₹)', symbol: '₹' },
  { code: '€', label: 'EUR (€)', symbol: '€' },
  { code: '£', label: 'GBP (£)', symbol: '£' },
  { code: 'A$', label: 'AUD (A$)', symbol: 'A$' },
  { code: 'C$', label: 'CAD (C$)', symbol: 'C$' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  savedCount,
  onOpenHistory,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/75 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('checker')}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/25 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  CREDIT<span className="text-cyan-400 font-mono">PULSE</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  BFSI Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                AI Loan Eligibility & Credit Intelligence Platform
              </p>
            </div>
          </div>

          {/* Core Tools Navigation */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/80 border border-white/10 shadow-inner">
            {[
              { id: 'checker', label: 'Loan Eligibility', icon: ShieldCheck },
              { id: 'credit', label: 'Credit Analyzer', icon: BrainCircuit },
              { id: 'emi', label: 'EMI Calculator', icon: Coins },
              { id: 'tips', label: 'AI Advisor', icon: Sparkles },
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Currency & Session History */}
          <div className="flex items-center space-x-3">
            {/* Currency Selector */}
            <div className="relative flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-900/90 text-xs font-semibold text-slate-200 border border-white/10 rounded-lg px-2.5 py-1.5 focus:border-cyan-500 focus:outline-none cursor-pointer appearance-none pr-7 hover:bg-slate-800 transition"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Session Records Button */}
            <button
              onClick={onOpenHistory}
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
              title="View saved session evaluations & exports"
            >
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Records</span>
              {savedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {savedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-between pb-3 pt-1 border-t border-white/5 overflow-x-auto space-x-2">
          {[
            { id: 'checker', label: 'Loan Eligibility', icon: ShieldCheck },
            { id: 'credit', label: 'Credit Score', icon: BrainCircuit },
            { id: 'emi', label: 'EMI Calculator', icon: Coins },
            { id: 'tips', label: 'AI Advisor', icon: Sparkles },
          ].map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTab === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
