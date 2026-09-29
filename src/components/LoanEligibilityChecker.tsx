import React, { useState, useId } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building2,
  Clock,
  FileCheck2,
  Save,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Sliders,
  DollarSign,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CurrencyCode,
  LoanInputState,
  LoanUnderwritingResult,
  SavedEvaluationRecord,
} from '../types/financial';
import { formatCurrency } from '../utils/formatters';

interface LoanEligibilityCheckerProps {
  currency: CurrencyCode;
  onSaveRecord: (record: SavedEvaluationRecord) => void;
  onNavigateToTab: (tab: string) => void;
}

const loanTypes = [
  { id: 'Home Loan', label: 'Home Loan / Mortgage', baseRate: '7.2%', icon: '🏠' },
  { id: 'Personal Loan', label: 'Personal Loan (Unsecured)', baseRate: '12.5%', icon: '💳' },
  { id: 'Auto Loan', label: 'Auto / Car Loan', baseRate: '8.0%', icon: '🚗' },
  { id: 'Education Loan', label: 'Education Loan', baseRate: '9.0%', icon: '🎓' },
  { id: 'Business Loan', label: 'Business Enterprise Loan', baseRate: '13.5%', icon: '🏢' },
];

const employmentTypes = [
  { id: 'Salaried', label: 'Salaried Professional' },
  { id: 'Self-Employed', label: 'Self-Employed Professional' },
  { id: 'Business', label: 'Business Owner / Partner' },
];

export const LoanEligibilityChecker: React.FC<LoanEligibilityCheckerProps> = ({
  currency,
  onSaveRecord,
  onNavigateToTab,
}) => {
  const [inputs, setInputs] = useState<LoanInputState>({
    monthlyIncome: 6500,
    existingEmis: 850,
    loanAmount: 180000,
    tenureYears: 15,
    loanType: 'Home Loan',
    employmentType: 'Salaried',
    creditScore: 760,
    coApplicantIncome: 0,
    currency,
  });

  const [hasCoApplicant, setHasCoApplicant] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LoanUnderwritingResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync currency from prop
  React.useEffect(() => {
    setInputs((prev) => ({ ...prev, currency }));
  }, [currency]);

  // Real-time deterministic figures
  const totalIncome = inputs.monthlyIncome + (hasCoApplicant ? inputs.coApplicantIncome : 0);
  const tenureMonths = inputs.tenureYears * 12;

  // Indicative rate
  let activeBaseRate = 8.5;
  if (inputs.loanType === 'Home Loan') activeBaseRate = 7.2;
  else if (inputs.loanType === 'Personal Loan') activeBaseRate = 12.5;
  else if (inputs.loanType === 'Auto Loan') activeBaseRate = 8.0;
  else if (inputs.loanType === 'Education Loan') activeBaseRate = 9.0;
  else if (inputs.loanType === 'Business Loan') activeBaseRate = 13.5;

  if (inputs.creditScore >= 800) activeBaseRate -= 0.75;
  else if (inputs.creditScore >= 750) activeBaseRate -= 0.35;
  else if (inputs.creditScore < 650) activeBaseRate += 2.0;
  else if (inputs.creditScore < 600) activeBaseRate += 4.0;

  const monthlyRate = activeBaseRate / 12 / 100;
  const calculatedEmi =
    monthlyRate === 0
      ? inputs.loanAmount / tenureMonths
      : (inputs.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const proposedObligations = inputs.existingEmis + calculatedEmi;
  const proposedFOIR = totalIncome > 0 ? (proposedObligations / totalIncome) * 100 : 0;
  const currentFOIR = totalIncome > 0 ? (inputs.existingEmis / totalIncome) * 100 : 0;

  const maxAllowedFOIR = inputs.loanType === 'Home Loan' ? 55 : 50;
  const maxDisposableForEmi = Math.max(0, totalIncome * (maxAllowedFOIR / 100) - inputs.existingEmis);
  const maxEligibleAmount =
    monthlyRate === 0
      ? maxDisposableForEmi * tenureMonths
      : (maxDisposableForEmi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));

  const handleRunUnderwriting = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/ai/loan-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inputs,
          coApplicantIncome: hasCoApplicant ? inputs.coApplicantIncome : 0,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Server returned error');
      }

      const data: LoanUnderwritingResult = await response.json();
      data.evaluatedAt = new Date().toISOString();
      setResult(data);

      if (data.approvalProbability >= 70) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#6366f1'],
        });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Underwriting service experienced a temporary delay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToHistory = () => {
    if (!result) return;
    const record: SavedEvaluationRecord = {
      id: `eval_${Date.now()}`,
      timestamp: new Date().toISOString(),
      loanType: inputs.loanType,
      currency,
      monthlyIncome: totalIncome,
      loanAmount: inputs.loanAmount,
      tenureYears: inputs.tenureYears,
      creditScore: inputs.creditScore,
      approvalProbability: result.approvalProbability,
      decisionStatus: result.decisionStatus,
      calculatedEmi: result.metrics.calculatedEmi,
      proposedFOIR: result.metrics.proposedFOIR,
    };
    onSaveRecord(record);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const scoreLabel =
    inputs.creditScore >= 800
      ? 'Exceptional'
      : inputs.creditScore >= 740
      ? 'Very Good'
      : inputs.creditScore >= 670
      ? 'Good'
      : inputs.creditScore >= 580
      ? 'Fair'
      : 'Poor';

  const scoreColor =
    inputs.creditScore >= 740
      ? 'text-emerald-400'
      : inputs.creditScore >= 670
      ? 'text-cyan-400'
      : inputs.creditScore >= 580
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Intro Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-Time BFSI Underwriting AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Instant AI Loan Eligibility Checker
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Evaluate borrowing limits, Debt-to-Income (FOIR) ratios, and bank approval probabilities instantly.
              Powered by real-time quantitative risk models with deep underwriting diagnostics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Banking Benchmark
              </span>
              <span className="text-sm font-bold text-cyan-400 font-mono">Max 50-55% DTI</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Approval Model
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Real-time Live Metrics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Applicant & Loan Parameters</h2>
              </div>
              <span className="text-xs text-slate-400">Step 1 of 2</span>
            </div>

            {/* Loan Type Selection Pills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Loan Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {loanTypes.map((t) => {
                  const isSelected = inputs.loanType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setInputs({ ...inputs, loanType: t.id })}
                      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-white/10 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-xl mb-1">{t.icon}</span>
                      <span className="text-xs font-bold truncate w-full">{t.id}</span>
                      <span className="text-[10px] text-slate-400">From {t.baseRate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Employment Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Employment Profile
              </label>
              <div className="grid grid-cols-3 gap-2">
                {employmentTypes.map((emp) => {
                  const active = inputs.employmentType === emp.id;
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setInputs({ ...inputs, employmentType: emp.id })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition text-center truncate cursor-pointer ${
                        active
                          ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                          : 'bg-slate-900/50 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {emp.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Net Income */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Monthly Net Take-Home Income
                </label>
                <div className="flex items-center space-x-1 font-mono font-bold text-cyan-400 text-base">
                  <span>{currency}</span>
                  <input
                    type="number"
                    value={inputs.monthlyIncome}
                    onChange={(e) =>
                      setInputs({ ...inputs, monthlyIncome: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-28 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="1000"
                max="30000"
                step="250"
                value={inputs.monthlyIncome}
                onChange={(e) => setInputs({ ...inputs, monthlyIncome: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2">
                {[3000, 5000, 8000, 15000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setInputs({ ...inputs, monthlyIncome: preset })}
                    className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/50 transition cursor-pointer"
                  >
                    {formatCurrency(preset, currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Co-applicant Toggle & Input */}
            <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Add Co-Applicant (Spouse / Parent)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasCoApplicant(!hasCoApplicant)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    hasCoApplicant ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md" />
                </button>
              </div>

              {hasCoApplicant && (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Co-Applicant Monthly Net Income:</span>
                  <div className="flex items-center space-x-1 font-mono font-bold text-cyan-400 text-sm">
                    <span>{currency}</span>
                    <input
                      type="number"
                      value={inputs.coApplicantIncome}
                      onChange={(e) =>
                        setInputs({ ...inputs, coApplicantIncome: Math.max(0, Number(e.target.value)) })
                      }
                      className="w-24 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Existing Monthly Debt EMIs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Existing Monthly Obligations / EMIs
                </label>
                <div className="flex items-center space-x-1 font-mono font-bold text-amber-400 text-base">
                  <span>{currency}</span>
                  <input
                    type="number"
                    value={inputs.existingEmis}
                    onChange={(e) =>
                      setInputs({ ...inputs, existingEmis: Math.max(0, Number(e.target.value)) })
                    }
                    className="w-24 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={inputs.existingEmis}
                onChange={(e) => setInputs({ ...inputs, existingEmis: Number(e.target.value) })}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Include current car loans, credit card minimums, and personal loans.
              </p>
            </div>

            {/* Desired Loan Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Desired Loan Amount
                </label>
                <div className="flex items-center space-x-1 font-mono font-bold text-white text-base">
                  <span>{currency}</span>
                  <input
                    type="number"
                    value={inputs.loanAmount}
                    onChange={(e) =>
                      setInputs({ ...inputs, loanAmount: Math.max(1000, Number(e.target.value)) })
                    }
                    className="w-32 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="1000000"
                step="5000"
                value={inputs.loanAmount}
                onChange={(e) => setInputs({ ...inputs, loanAmount: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2">
                {[50000, 150000, 300000, 600000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setInputs({ ...inputs, loanAmount: amt })}
                    className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/50 transition cursor-pointer"
                  >
                    {formatCurrency(amt, currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Tenure (Years) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Loan Tenure
                </label>
                <span className="font-mono font-bold text-white text-sm">
                  {inputs.tenureYears} Years ({tenureMonths} Months)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={inputs.tenureYears}
                onChange={(e) => setInputs({ ...inputs, tenureYears: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>1 Year</span>
                <span>5 Years</span>
                <span>15 Years</span>
                <span>30 Years</span>
              </div>
            </div>

            {/* Credit Bureau Score */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Credit Bureau Score (FICO / CIBIL)
                </label>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold ${scoreColor}`}>{scoreLabel}</span>
                  <span className="font-mono font-extrabold text-white text-lg bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                    {inputs.creditScore}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="300"
                max="850"
                step="5"
                value={inputs.creditScore}
                onChange={(e) => setInputs({ ...inputs, creditScore: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>300 (Poor)</span>
                <span>650 (Fair)</span>
                <span>750 (Prime)</span>
                <span>850 (Exceptional)</span>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleRunUnderwriting}
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl p-0.5 font-bold text-sm text-white shadow-xl shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-300 group-hover:scale-105" />
              <div className="relative flex items-center justify-center space-x-2 px-6 py-4 rounded-[10px] bg-slate-950/90 group-hover:bg-slate-950/75 transition">
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
                    <span>Evaluating Banking Risk Models...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <span>Run AI BFSI Underwriting Assessment</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Right Form: Live Math Metrics & Diagnostics */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Quick Math Snapshot */}
          <div className="glass-panel rounded-2xl p-6 space-y-5 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Instant Underwriting Ratios
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                Live Calculation
              </span>
            </div>

            {/* FOIR Gauge card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Proposed FOIR / DTI</span>
                  <span className="text-xl font-extrabold font-mono text-white">
                    {proposedFOIR.toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Bank Threshold</span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Max {maxAllowedFOIR}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    proposedFOIR <= 40
                      ? 'bg-emerald-400'
                      : proposedFOIR <= maxAllowedFOIR
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (proposedFOIR / maxAllowedFOIR) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    proposedFOIR <= 40
                      ? 'text-emerald-400 font-semibold'
                      : proposedFOIR <= maxAllowedFOIR
                      ? 'text-amber-400 font-semibold'
                      : 'text-rose-400 font-semibold'
                  }
                >
                  {proposedFOIR <= 40
                    ? '✓ Prime Safe Margin'
                    : proposedFOIR <= maxAllowedFOIR
                    ? '⚠️ Moderate Obligation'
                    : '✕ Exceeds Banking Limit'}
                </span>
                <span className="text-slate-500">Current: {currentFOIR.toFixed(1)}%</span>
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Estimated EMI</span>
                <div className="text-lg font-mono font-extrabold text-cyan-300">
                  {formatCurrency(calculatedEmi, currency)}
                  <span className="text-xs text-slate-400 font-normal">/mo</span>
                </div>
                <span className="text-[10px] text-slate-500 block">@ ~{activeBaseRate.toFixed(1)}% APR</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Max Eligible</span>
                <div className="text-lg font-mono font-extrabold text-emerald-400">
                  {formatCurrency(maxEligibleAmount, currency)}
                </div>
                <span className="text-[10px] text-slate-500 block">Based on FOIR ceiling</span>
              </div>
            </div>

            {/* Quick Tip Pill */}
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Want to reduce your EMI? Try our{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToTab('emi')}
                  className="underline font-bold text-cyan-300 hover:text-white cursor-pointer"
                >
                  EMI Calculator & Prepayment Simulator
                </button>{' '}
                to explore interest savings.
              </span>
            </div>
          </div>

          {/* Underwriting Evaluation Output Result */}
          {result && (
            <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6 border border-cyan-500/30 glow-cyan animate-in fade-in duration-300">
              {/* Header with status badge */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-white text-base">Underwriting Result</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${
                    result.decisionStatus === 'Strongly Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : result.decisionStatus === 'Conditionally Approved'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : result.decisionStatus === 'High Risk / Under Review'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {result.decisionStatus}
                </span>
              </div>

              {/* Approval Probability Dial */}
              <div className="flex items-center space-x-6 p-4 rounded-xl bg-slate-950/60 border border-white/10">
                <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={
                        result.approvalProbability >= 70
                          ? 'text-cyan-400'
                          : result.approvalProbability >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }
                      strokeDasharray={`${result.approvalProbability}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-extrabold font-mono text-white">
                      {result.approvalProbability}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      Chance
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    Risk Classification
                  </div>
                  <div className="text-sm font-bold text-white">{result.riskRating}</div>
                  <div className="text-xs text-slate-400">
                    Est. Rate: <span className="text-cyan-300 font-mono font-bold">{result.estimatedInterestRate}%</span>
                    {' • '}Max: <span className="text-emerald-300 font-mono font-bold">{formatCurrency(result.recommendedMaxLoan, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                  AI Underwriting Summary
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{result.summary}</p>
              </div>

              {/* Strengths & Red Flags */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Application Strengths</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                    {result.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                {result.riskFactors && result.riskFactors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-amber-400 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Risk Concerns to Mitigate</span>
                    </span>
                    <ul className="space-y-1 text-xs text-slate-300 pl-4 list-disc">
                      {result.riskFactors.map((r, idx) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Lender Match & Turnaround */}
              {result.lenderMatch && (
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-[11px] uppercase">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Best Fit Banking Partners</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.lenderMatch.recommendedLenderTypes.map((l, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-slate-300 text-[11px]"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-white/5">
                    <span>Turnaround: {result.lenderMatch.estimatedProcessingTime}</span>
                    <span>KYC: {result.lenderMatch.documentationLevel}</span>
                  </div>
                </div>
              )}

              {/* Action Plan */}
              {result.actionPlan && result.actionPlan.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">
                    Recommended Action Roadmap
                  </span>
                  <div className="space-y-1.5">
                    {result.actionPlan.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-300 flex items-start space-x-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5 font-bold">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons: Save & Export */}
              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleSaveToHistory}
                  disabled={savedSuccess}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-xs font-bold text-white transition cursor-pointer"
                >
                  <Save className="w-4 h-4 text-cyan-400" />
                  <span>{savedSuccess ? 'Saved to Records ✓' : 'Save Evaluation Record'}</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
