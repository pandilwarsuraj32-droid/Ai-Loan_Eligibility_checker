import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoanEligibilityChecker } from './components/LoanEligibilityChecker';
import { CreditScoreAnalyzer } from './components/CreditScoreAnalyzer';
import { EmiCalculator } from './components/EmiCalculator';
import { FinancialTips } from './components/FinancialTips';
import { SessionHistoryModal } from './components/SessionHistoryModal';
import { CurrencyCode, SavedEvaluationRecord } from './types/financial';
import { ShieldCheck, Sparkles, Lock, ArrowUpRight } from 'lucide-react';

const STORAGE_KEY = 'creditpulse_saved_evaluations';
const CURRENCY_KEY = 'creditpulse_currency_pref';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('checker');
  const [currency, setCurrency] = useState<CurrencyCode>('$');
  const [savedRecords, setSavedRecords] = useState<SavedEvaluationRecord[]>([]);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedRecords(JSON.parse(stored));
      }
      const storedCurr = localStorage.getItem(CURRENCY_KEY);
      if (storedCurr) {
        setCurrency(storedCurr as CurrencyCode);
      }
    } catch (e) {
      console.warn('Storage load failed', e);
    }
  }, []);

  const handleCurrencyChange = (newCurr: CurrencyCode) => {
    setCurrency(newCurr);
    try {
      localStorage.setItem(CURRENCY_KEY, newCurr);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSaveRecord = (record: SavedEvaluationRecord) => {
    const updated = [record, ...savedRecords];
    setSavedRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleClearHistory = () => {
    setSavedRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white relative">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[10%] w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={handleCurrencyChange}
        savedCount={savedRecords.length}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'checker' && (
          <LoanEligibilityChecker
            currency={currency}
            onSaveRecord={handleSaveRecord}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'credit' && <CreditScoreAnalyzer />}

        {activeTab === 'emi' && <EmiCalculator currency={currency} />}

        {activeTab === 'tips' && <FinancialTips />}
      </main>

      {/* Global Records Modal */}
      <SessionHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        records={savedRecords}
        onClearHistory={handleClearHistory}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">
                CREDIT<span className="text-cyan-400 font-mono">PULSE</span> BFSI Intelligence
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Third-Party Tracking</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Powered by Gemini 3.8 Flash</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed text-center md:text-left border-t border-white/5 pt-4">
            Disclaimer: CreditPulse is an educational decision-support simulation suite. Calculations and AI
            underwriting outputs are indicative projections based on standard BFSI underwriting methodologies (FOIR,
            DTI, and FICO/Vantage score models). Final loan approval, interest rate margins, and disbursement criteria
            are determined solely by regulated lending institutions upon physical KYC and credit bureau verification.
          </p>
        </div>
      </footer>
    </div>
  );
}
