import React from 'react';
import {
  X,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Calendar,
  Layers,
} from 'lucide-react';
import { SavedEvaluationRecord } from '../types/financial';
import { formatCurrency, exportRecordsToCSV, exportRecordsToJSON } from '../utils/formatters';

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: SavedEvaluationRecord[];
  onClearHistory: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-7 space-y-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Saved Loan Evaluation Records</h2>
              <p className="text-xs text-slate-400">
                Persistent local session records. Export anytime to CSV or JSON.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {records.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500 mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-300 font-semibold">No evaluations recorded yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Run the Loan Eligibility Checker and click "Save Evaluation Record" to persist your results here.
              </p>
            </div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2 hover:border-cyan-500/30 transition text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{r.loanType}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.approvalProbability >= 70
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : r.approvalProbability >= 50
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {r.decisionStatus} ({r.approvalProbability}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(r.timestamp).toLocaleDateString()} {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono text-[11px] pt-1">
                  <div>
                    Requested:{' '}
                    <span className="text-white font-bold">{formatCurrency(r.loanAmount, r.currency)}</span>
                  </div>
                  <div>
                    Income:{' '}
                    <span className="text-white font-bold">{formatCurrency(r.monthlyIncome, r.currency)}/mo</span>
                  </div>
                  <div>
                    EMI:{' '}
                    <span className="text-cyan-300 font-bold">{formatCurrency(r.calculatedEmi, r.currency)}</span>
                  </div>
                  <div>
                    Score:{' '}
                    <span className="text-indigo-300 font-bold">{r.creditScore}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {records.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('Clear all saved evaluation records?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-xs font-semibold text-rose-300 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear History</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportRecordsToJSON(records)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => exportRecordsToCSV(records)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to CSV Sheet</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
