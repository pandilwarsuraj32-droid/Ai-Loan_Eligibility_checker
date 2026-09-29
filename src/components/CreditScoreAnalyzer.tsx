import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  Percent,
  Clock,
  RefreshCw,
  Zap,
  Target,
} from 'lucide-react';
import { CreditAnalyzerResult, CreditAnalyzerState } from '../types/financial';

export const CreditScoreAnalyzer: React.FC = () => {
  const [factors, setFactors] = useState<CreditAnalyzerState>({
    creditScore: 715,
    paymentHistory: 97,
    creditUtilization: 38,
    creditAgeYears: 4.5,
    totalAccounts: 6,
    hardInquiriesLast12M: 3,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CreditAnalyzerResult | null>(null);

  const getScoreClassification = (score: number) => {
    if (score >= 800) return { label: 'Exceptional', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40' };
    if (score >= 740) return { label: 'Very Good', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/40' };
    if (score >= 670) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40' };
    if (score >= 580) return { label: 'Fair', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40' };
    return { label: 'Poor', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40' };
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/credit-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(factors),
      });

      if (!response.ok) throw new Error('Failed to analyze credit');
      const data: CreditAnalyzerResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scoreClass = getScoreClassification(factors.creditScore);

  // SVG Gauge calculations
  const minScore = 300;
  const maxScore = 850;
  const percentage = Math.min(100, Math.max(0, ((factors.creditScore - minScore) / (maxScore - minScore)) * 100));
  const strokeDashoffset = 283 - (283 * (percentage * 0.75)) / 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Multi-Factor Bureau Audit & Booster</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Credit Score Intelligence & Diagnostic Analyzer
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Unpack the 5 weighted components governing your credit score. Pinpoint exact interest-rate bottlenecks,
              uncover hidden friction points, and simulate your 90-day score booster projection.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Bureau Model
              </span>
              <span className="text-sm font-bold text-indigo-400 font-mono">FICO 8 / Vantage 4.0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Bureau Score Dial & 5 Factor Sliders */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6">
            {/* Score Dial Display Card */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-slate-950/70 border border-white/10 gap-6">
              {/* Circular Gauge */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-135" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="212"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#creditScoreGradient)"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="212"
                    strokeDashoffset={212 - (212 * (percentage / 100))}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                  <defs>
                    <linearGradient id="creditScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="35%" stopColor="#f59e0b" />
                      <stop offset="70%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {factors.creditScore}
                  </span>
                  <span className={`text-xs font-bold ${scoreClass.color} uppercase tracking-wider`}>
                    {scoreClass.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">300 - 850</span>
                </div>
              </div>

              {/* Score Range Legend & Quick Presets */}
              <div className="space-y-3 w-full sm:w-auto flex-1">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
                  Select Score Preset
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { score: 560, name: 'Poor (560)' },
                    { score: 640, name: 'Fair (640)' },
                    { score: 715, name: 'Good (715)' },
                    { score: 810, name: 'Exceptional (810)' },
                  ].map((p) => (
                    <button
                      key={p.score}
                      type="button"
                      onClick={() => setFactors({ ...factors, creditScore: p.score })}
                      className={`p-2 rounded-lg border text-left font-mono font-medium transition cursor-pointer ${
                        factors.creditScore === p.score
                          ? 'bg-indigo-600/30 border-indigo-400 text-white'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5 space-y-1">
                  <div className="flex justify-between">
                    <span>Prime Eligibility:</span>
                    <span className="font-semibold text-emerald-400">Score 720+</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Super-Prime Rates:</span>
                    <span className="font-semibold text-cyan-400">Score 780+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>FINE-TUNE BUREAU SCORE</span>
                <span className="font-mono text-cyan-400">{factors.creditScore} PTS</span>
              </div>
              <input
                type="range"
                min="300"
                max="850"
                step="1"
                value={factors.creditScore}
                onChange={(e) => setFactors({ ...factors, creditScore: Number(e.target.value) })}
                className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* 5 Bureau Factor Controls */}
            <div className="border-t border-white/10 pt-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>The 5 Weighted Bureau Factors</span>
                </h3>
                <span className="text-[11px] text-slate-400">Total 100% Impact</span>
              </div>

              {/* 1. Payment History (35%) */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-xs font-bold text-white">Payment History</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      35% Weight
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    {factors.paymentHistory}% On-Time
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="100"
                  step="1"
                  value={factors.paymentHistory}
                  onChange={(e) => setFactors({ ...factors, paymentHistory: Number(e.target.value) })}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 block">
                  Every late mark over 30 days remains on reports for up to 7 years.
                </span>
              </div>

              {/* 2. Credit Utilization (30%) */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-white">Credit Card Utilization</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      30% Weight
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      factors.creditUtilization <= 10
                        ? 'text-emerald-400'
                        : factors.creditUtilization <= 30
                        ? 'text-cyan-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {factors.creditUtilization}% Used
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={factors.creditUtilization}
                  onChange={(e) => setFactors({ ...factors, creditUtilization: Number(e.target.value) })}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-400">&lt;10% Ideal</span>
                  <span className="text-slate-400">&lt;30% Recommended</span>
                  <span className="text-rose-400">&gt;50% Penalty</span>
                </div>
              </div>

              {/* 3. Credit Age (15%) */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs font-bold text-white">Average Credit Age</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      15% Weight
                    </span>
                  </div>
                  <span className="font-mono font-bold text-indigo-300 text-sm">
                    {factors.creditAgeYears} Years
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.5"
                  value={factors.creditAgeYears}
                  onChange={(e) => setFactors({ ...factors, creditAgeYears: Number(e.target.value) })}
                  className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* 4. Total Accounts & Credit Mix (10%) */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold text-white">Active Accounts & Credit Mix</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      10% Weight
                    </span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {factors.totalAccounts} Accounts
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={factors.totalAccounts}
                  onChange={(e) => setFactors({ ...factors, totalAccounts: Number(e.target.value) })}
                  className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* 5. Hard Inquiries in 12M (10%) */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span className="text-xs font-bold text-white">Hard Inquiries (Last 12 Months)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      10% Weight
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm ${
                      factors.hardInquiriesLast12M <= 1
                        ? 'text-emerald-400'
                        : factors.hardInquiriesLast12M <= 3
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {factors.hardInquiriesLast12M} Inquiries
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={factors.hardInquiriesLast12M}
                  onChange={(e) => setFactors({ ...factors, hardInquiriesLast12M: Number(e.target.value) })}
                  className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Run Analysis Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="w-full relative group overflow-hidden rounded-xl p-0.5 font-bold text-sm text-white shadow-xl shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 transition-all duration-300 group-hover:scale-105" />
              <div className="relative flex items-center justify-center space-x-2 px-6 py-4 rounded-[10px] bg-slate-950/90 group-hover:bg-slate-950/75 transition">
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    <span>Analyzing Credit Bureau Vectors...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>Run AI Credit Diagnostic & 90-Day Booster</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Right: AI Diagnostic Output & Roadmap */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Highlight Card: Potential Points Gain & Bottleneck */}
              <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 glow-cyan space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-white text-base">Credit Score Health: {result.healthScore}/100</h3>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    +{result.potentialPointGain} PTS GAIN POTENTIAL
                  </span>
                </div>

                {/* Primary Bottleneck Callout */}
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-rose-300 font-bold uppercase tracking-wider text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Critical Score Bottleneck</span>
                  </div>
                  <p className="text-slate-200">{result.primaryBottleneck}</p>
                </div>

                {/* Factor Breakdown Status Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Detailed Vector Audit
                  </span>
                  <div className="space-y-2">
                    {result.factorBreakdown.map((f, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900/70 border border-white/5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{f.factor}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              f.status === 'Optimal'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : f.status === 'Satisfactory'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : f.status === 'Needs Attention'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {f.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{f.commentary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 30-60-90 Day Action Roadmap */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>30 / 60 / 90-Day Score Recovery Blueprint</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border-l-4 border-l-cyan-400 border border-white/5 space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Day 1 to 30: Quick-Win Statement Timing
                    </span>
                    <p className="text-slate-200">{result.roadmap.day30}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border-l-4 border-l-indigo-400 border border-white/5 space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                      Day 31 to 60: Structural Capacity Expansion
                    </span>
                    <p className="text-slate-200">{result.roadmap.day60}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border-l-4 border-l-emerald-400 border border-white/5 space-y-1 text-xs">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Day 61 to 90: Compounding Bureau Age & Autopay
                    </span>
                    <p className="text-slate-200">{result.roadmap.day90}</p>
                  </div>
                </div>
              </div>

              {/* Bureau Pro-Tips */}
              {result.proTips && result.proTips.length > 0 && (
                <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-3">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    <span>Insider Bureau Pro-Tips</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {result.proTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Empty State guidance */
            <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-white">Bureau Diagnostic Ready</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Adjust the 5 factor sliders on the left matching your credit report, then click "Run AI Credit
                  Diagnostic" to reveal your personalized 90-day recovery plan.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 text-left text-xs space-y-2 text-slate-300">
                <div className="font-bold text-slate-200">Did you know?</div>
                <p className="text-slate-400 text-[11px]">
                  FICO algorithms calculate revolving utilization on the statement date, not your due date. Making a
                  mid-month payment immediately cuts reported utilization!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
