import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  BookmarkCheck,
  Send,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { FinancialTipResponse } from '../types/financial';

const quickPrompts = [
  'Should I use my savings to prepay my home loan or invest?',
  'How can I lower my debt-to-income (FOIR) ratio quickly before applying for a mortgage?',
  'What is the difference between debt avalanche and debt snowball?',
  'When is taking a personal loan to consolidate credit card debt a smart move?',
  'How much emergency cash buffer should I retain before taking a loan?',
];

const categoryPills = [
  { id: 'all', label: 'All Advisory' },
  { id: 'debt', label: 'Debt Restructuring' },
  { id: 'credit', label: 'Credit Health' },
  { id: 'mortgage', label: 'Home Mortgages' },
  { id: 'safety', label: 'Emergency Buffers' },
];

export const FinancialTips: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [queryInput, setQueryInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tipData, setTipData] = useState<FinancialTipResponse | null>(null);

  const fetchAdvice = async (category: string, userQuery?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/financial-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          userQuery: userQuery || '',
          profile: {
            monthlyIncome: 6500,
            existingEmis: 850,
            creditScore: 740,
            loanType: 'Personal / Mortgage Loan',
          },
        }),
      });

      if (!response.ok) throw new Error('Advisory fetch failed');
      const data: FinancialTipResponse = await response.json();
      setTipData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  React.useEffect(() => {
    fetchAdvice('all');
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    fetchAdvice(cat, queryInput);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim()) return;
    fetchAdvice(selectedCategory, queryInput);
  };

  const handlePresetClick = (promptText: string) => {
    setQueryInput(promptText);
    fetchAdvice(selectedCategory, promptText);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BFSI Strategic Advisory Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Financial Wisdom & Debt Advisor
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Get real-time intelligent financial analysis powered by AI reasoning. Ask tailored questions about
              borrowing thresholds, repayment acceleration, and credit optimization.
            </p>
          </div>
        </div>
      </div>

      {/* Query Bar & Category Pills */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {categoryPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleCategoryChange(pill.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === pill.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Custom Question Form */}
        <form onSubmit={handleCustomSubmit} className="relative flex items-center">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Ask anything (e.g. 'Should I pay off my credit cards before applying for a home loan?')..."
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 pr-12"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Suggested Prompts */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular Inquiries</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handlePresetClick(q)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-white/5 text-slate-300 hover:text-cyan-300 transition text-left cursor-pointer truncate max-w-full"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Advice Output Display */}
      {loading ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3 border border-white/10">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-300">
            Synthesizing BFSI financial reasoning with Gemini 3.8 Flash...
          </p>
        </div>
      ) : tipData ? (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-cyan-500/30 glow-cyan space-y-6">
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400">
                Strategic Executive Guidance
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {tipData.headline}
              </h2>
              <p className="text-slate-200 text-sm leading-relaxed p-4 rounded-xl bg-slate-900/70 border border-white/5">
                {tipData.coreAdvice}
              </p>
            </div>

            {/* Actionable Pillars */}
            <div className="space-y-3">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Strategic Action Pillars
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tipData.actionablePillars.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{p.pillar}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.impact === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : p.impact === 'High'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {p.impact}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Golden Rules */}
            {tipData.goldenRules && tipData.goldenRules.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-2.5">
                <span className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center space-x-1.5">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>The 3 Non-Negotiable Rules of Prudent Borrowing</span>
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {tipData.goldenRules.map((rule, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Questions */}
            {tipData.suggestedNextQuestions && tipData.suggestedNextQuestions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  Deep-Dive Questions to Explore Next
                </span>
                <div className="flex flex-wrap gap-2">
                  {tipData.suggestedNextQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetClick(q)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <span>{q}</span>
                      <ArrowRight className="w-3 h-3 text-cyan-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
