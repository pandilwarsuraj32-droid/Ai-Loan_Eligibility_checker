import React, { useState, useMemo } from 'react';
import {
  Coins,
  Sparkles,
  TrendingDown,
  Calculator,
  ArrowRight,
  Clock,
  PieChart,
  Calendar,
  Layers,
  Zap,
  CheckCircle2,
  RefreshCw,
  Table,
} from 'lucide-react';
import { CurrencyCode, EmiOptimizerResult } from '../types/financial';
import { formatCurrency, computeAmortization } from '../utils/formatters';

interface EmiCalculatorProps {
  currency: CurrencyCode;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({ currency }) => {
  const [loanAmount, setLoanAmount] = useState<number>(150000);
  const [interestRate, setInterestRate] = useState<number>(7.8);
  const [tenureYears, setTenureYears] = useState<number>(15);
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(150);
  const [showAmortizationTable, setShowAmortizationTable] = useState<boolean>(false);
  const [scheduleView, setScheduleView] = useState<'yearly' | 'monthly'>('yearly');

  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<EmiOptimizerResult | null>(null);

  // Compute standard amortization
  const standardAmortization = useMemo(() => {
    return computeAmortization(loanAmount, interestRate, tenureYears, 0);
  }, [loanAmount, interestRate, tenureYears]);

  // Compute accelerated amortization with extra monthly prepayment
  const acceleratedAmortization = useMemo(() => {
    return computeAmortization(loanAmount, interestRate, tenureYears, extraMonthlyPayment);
  }, [loanAmount, interestRate, tenureYears, extraMonthlyPayment]);

  const interestSaved = Math.max(
    0,
    standardAmortization.totalInterest - acceleratedAmortization.totalInterest
  );
  const monthsSaved = Math.max(
    0,
    standardAmortization.actualMonths - acceleratedAmortization.actualMonths
  );
  const yearsSaved = (monthsSaved / 12).toFixed(1);

  // Donut chart calculations
  const totalStandardPayment = standardAmortization.totalPayment;
  const principalPercent = totalStandardPayment > 0 ? (loanAmount / totalStandardPayment) * 100 : 50;
  const interestPercent = 100 - principalPercent;

  const handleRunAiOptimization = async () => {
    setLoadingAi(true);
    try {
      const response = await fetch('/api/ai/emi-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanAmount,
          interestRate,
          tenureYears,
          monthlyIncome: 6000,
          currency,
        }),
      });

      if (!response.ok) throw new Error('Optimizer failure');
      const data: EmiOptimizerResult = await response.json();
      setAiResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-white/10">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              <span>Mathematical Amortization & Prepayment Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              EMI Calculator & Smart Prepayment Simulator
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Calculate exact monthly installments, visualize Principal vs Interest composition, and simulate how tiny
              extra monthly prepayments can shave years and thousands of currency units off your debt.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Loan Parameters</h2>
              </div>
              <span className="text-xs text-slate-400">Fixed Rate Amortization</span>
            </div>

            {/* Principal Loan Amount */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Principal Loan Amount
                </label>
                <div className="flex items-center space-x-1 font-mono font-bold text-white text-base">
                  <span>{currency}</span>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Math.max(1000, Number(e.target.value)))}
                    className="w-32 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="range"
                min="5000"
                max="1000000"
                step="5000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex gap-2">
                {[50000, 150000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmount(amt)}
                    className="px-2.5 py-1 rounded text-[11px] font-medium bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/50 transition cursor-pointer"
                  >
                    {formatCurrency(amt, currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Annual Interest Rate (% APR)
                </label>
                <div className="flex items-center space-x-1 font-mono font-bold text-cyan-400 text-base">
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
                    className="w-20 text-right bg-slate-900 border border-white/10 rounded px-2 py-0.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span>%</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>3% (Super Prime)</span>
                <span>8.5% (Standard)</span>
                <span>15% (Unsecured)</span>
                <span>25%</span>
              </div>
            </div>

            {/* Tenure (Years) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Loan Tenure
                </label>
                <span className="font-mono font-bold text-white text-base">
                  {tenureYears} Years ({tenureYears * 12} Months)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>1 Year</span>
                <span>5 Years</span>
                <span>15 Years</span>
                <span>30 Years</span>
              </div>
            </div>

            {/* Prepayment / Extra Monthly Paydown Simulator */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Extra Monthly Prepayment Simulator
                  </span>
                </div>
                <div className="flex items-center space-x-1 font-mono font-bold text-emerald-400 text-sm">
                  <span>+{currency}</span>
                  <input
                    type="number"
                    value={extraMonthlyPayment}
                    onChange={(e) => setExtraMonthlyPayment(Math.max(0, Number(e.target.value)))}
                    className="w-20 text-right bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-slate-400 text-xs font-normal">/mo</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={extraMonthlyPayment}
                onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>+$0</span>
                <span>+$250</span>
                <span>+$500</span>
                <span>+$1,000/mo</span>
              </div>
            </div>

            {/* AI Optimization Trigger */}
            <button
              onClick={handleRunAiOptimization}
              disabled={loadingAi}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 hover:from-cyan-600/40 hover:to-indigo-600/40 border border-cyan-500/30 text-cyan-300 font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              {loadingAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Multi-Scenario Amortization AI Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Get AI Prepayment & Refinancing Strategy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Visual Donut Chart, Big EMI Card & Prepayment Savings */}
        <div className="lg:col-span-6 space-y-6">
          {/* Big Output Card */}
          <div className="glass-panel rounded-2xl p-6 sm:p-7 space-y-6 border border-white/10">
            {/* Monthly EMI Big Display */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border border-white/10 text-center space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Standard Monthly Installment (EMI)
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono text-cyan-300 tracking-tight">
                {formatCurrency(standardAmortization.monthlyEmi, currency)}
                <span className="text-sm font-normal text-slate-400"> / month</span>
              </div>
              <p className="text-xs text-slate-400">
                Total repayment over {tenureYears} years:{' '}
                <span className="text-white font-mono font-bold">
                  {formatCurrency(standardAmortization.totalPayment, currency)}
                </span>
              </p>
            </div>

            {/* Prepayment Acceleration Impact Card */}
            {extraMonthlyPayment > 0 && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-300 font-bold uppercase tracking-wider text-[11px]">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Prepayment Advantage</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                    +{formatCurrency(extraMonthlyPayment, currency)}/mo Extra
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Total Interest Saved
                    </span>
                    <span className="text-lg font-extrabold font-mono text-emerald-400">
                      {formatCurrency(interestSaved, currency)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">
                      Loan Term Shortened
                    </span>
                    <span className="text-lg font-extrabold font-mono text-cyan-300">
                      {yearsSaved} Years Earlier
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive SVG Donut: Principal vs Interest Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                    Principal vs Interest Breakdown
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {principalPercent.toFixed(0)}% / {interestPercent.toFixed(0)}%
                </span>
              </div>

              {/* Visual Horizontal Segmented Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-cyan-500 rounded-l-full transition-all duration-300"
                    style={{ width: `${principalPercent}%` }}
                    title={`Principal: ${formatCurrency(loanAmount, currency)}`}
                  />
                  <div
                    className="bg-amber-400 rounded-r-full transition-all duration-300"
                    style={{ width: `${interestPercent}%` }}
                    title={`Interest: ${formatCurrency(standardAmortization.totalInterest, currency)}`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
                    <span className="text-slate-300 font-medium">Principal Loan:</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(loanAmount, currency)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="text-slate-300 font-medium">Total Interest:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatCurrency(standardAmortization.totalInterest, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Toggle Schedule Table Button */}
            <button
              onClick={() => setShowAmortizationTable(!showAmortizationTable)}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Table className="w-4 h-4 text-cyan-400" />
              <span>
                {showAmortizationTable ? 'Hide Amortization Table' : 'View Full Amortization Schedule'}
              </span>
            </button>
          </div>

          {/* AI Optimizer Results Card */}
          {aiResult && (
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/30 glow-cyan space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>AI Refinancing & Prepayment Analysis</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-200 leading-relaxed">
                {aiResult.keyTakeaway}
              </div>

              {/* Prepayment Scenarios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiResult.prepaymentScenarios.map((sc, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-white/5 space-y-1 text-xs">
                    <span className="font-bold text-white block">{sc.name}</span>
                    <div className="text-emerald-400 font-mono font-bold">
                      Save {formatCurrency(sc.estimatedInterestSaved, currency)}
                    </div>
                    <span className="text-slate-400 text-[11px] block">
                      Shortens term by {Math.round(sc.monthsSaved / 12)} yrs
                    </span>
                  </div>
                ))}
              </div>

              {/* Refinancing Verdict */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-1">
                <div className="font-bold text-indigo-300">
                  Refinancing Recommendation:{' '}
                  {aiResult.refinancingVerdict.isRefinancingRecommended ? '✓ Recommended' : '✕ Keep Current Loan'}
                </div>
                <p className="text-slate-300 text-[11px]">{aiResult.refinancingVerdict.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Amortization Table Modal/Section */}
      {showAmortizationTable && (
        <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/10 space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Amortization Schedule</h3>
              <p className="text-xs text-slate-400">
                Detailed breakdown of principal reduction, interest servicing, and balance trajectory.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setScheduleView('yearly')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  scheduleView === 'yearly'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Yearly Summary
              </button>
              <button
                type="button"
                onClick={() => setScheduleView('monthly')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  scheduleView === 'monthly'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly Schedule
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider sticky top-0">
                <tr>
                  <th className="py-3 px-4">{scheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                  <th className="py-3 px-4 text-right">Principal</th>
                  <th className="py-3 px-4 text-right">Interest</th>
                  <th className="py-3 px-4 text-right">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {scheduleView === 'yearly'
                  ? acceleratedAmortization.yearlySchedule.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-4 font-bold text-white">Year {row.year}</td>
                        <td className="py-2.5 px-4 text-right text-slate-300">
                          {formatCurrency(row.totalPayment, currency)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-cyan-300 font-semibold">
                          {formatCurrency(row.principalPaid, currency)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-amber-300">
                          {formatCurrency(row.interestPaid, currency)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-200">
                          {formatCurrency(row.endingBalance, currency)}
                        </td>
                      </tr>
                    ))
                  : acceleratedAmortization.monthlySchedule.slice(0, 120).map((row) => (
                      <tr key={row.month} className="hover:bg-slate-900/40">
                        <td className="py-2 px-4 text-slate-300">Month {row.month}</td>
                        <td className="py-2 px-4 text-right text-slate-300">
                          {formatCurrency(row.payment, currency)}
                        </td>
                        <td className="py-2 px-4 text-right text-cyan-300">
                          {formatCurrency(row.principal, currency)}
                        </td>
                        <td className="py-2 px-4 text-right text-amber-300">
                          {formatCurrency(row.interest, currency)}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-200">
                          {formatCurrency(row.balance, currency)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
