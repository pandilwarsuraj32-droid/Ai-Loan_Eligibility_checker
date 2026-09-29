import { CurrencyCode, SavedEvaluationRecord } from '../types/financial';

export function formatCurrency(amount: number, currency: CurrencyCode = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currency}0`;
  const rounded = Math.round(amount);
  return `${currency}${rounded.toLocaleString()}`;
}

export function formatCompactNumber(amount: number, currency: CurrencyCode = '$'): string {
  if (isNaN(amount)) return `${currency}0`;
  if (amount >= 10000000) return `${currency}${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 1000000) return `${currency}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(1)}k`;
  return `${currency}${Math.round(amount)}`;
}

export interface AmortizationRow {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface YearlyAmortizationRow {
  year: number;
  beginningBalance: number;
  totalPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
}

export function computeAmortization(
  principal: number,
  annualInterestRate: number,
  tenureYears: number,
  extraMonthlyPayment: number = 0
): {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  actualMonths: number;
  monthlySchedule: AmortizationRow[];
  yearlySchedule: YearlyAmortizationRow[];
} {
  const r = annualInterestRate / 12 / 100;
  const n = tenureYears * 12;

  if (principal <= 0 || n <= 0) {
    return {
      monthlyEmi: 0,
      totalInterest: 0,
      totalPayment: 0,
      actualMonths: 0,
      monthlySchedule: [],
      yearlySchedule: [],
    };
  }

  const baseEmi =
    r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const totalMonthlyOutflow = baseEmi + extraMonthlyPayment;
  let remainingBalance = principal;
  let totalInterestAccumulator = 0;
  let totalPaymentAccumulator = 0;

  const monthlySchedule: AmortizationRow[] = [];
  const yearlyMap = new Map<number, YearlyAmortizationRow>();

  let monthCount = 0;
  while (remainingBalance > 0.01 && monthCount < n * 2) {
    monthCount++;
    const currentYear = Math.ceil(monthCount / 12);
    const interestForMonth = remainingBalance * r;
    let principalForMonth = totalMonthlyOutflow - interestForMonth;

    if (principalForMonth > remainingBalance) {
      principalForMonth = remainingBalance;
    }

    const actualPaymentThisMonth = principalForMonth + interestForMonth;
    remainingBalance -= principalForMonth;
    if (remainingBalance < 0.01) remainingBalance = 0;

    totalInterestAccumulator += interestForMonth;
    totalPaymentAccumulator += actualPaymentThisMonth;

    monthlySchedule.push({
      month: monthCount,
      year: currentYear,
      payment: actualPaymentThisMonth,
      principal: principalForMonth,
      interest: interestForMonth,
      balance: remainingBalance,
    });

    if (!yearlyMap.has(currentYear)) {
      yearlyMap.set(currentYear, {
        year: currentYear,
        beginningBalance: monthlySchedule[monthCount - 1].balance + principalForMonth,
        totalPayment: 0,
        principalPaid: 0,
        interestPaid: 0,
        endingBalance: remainingBalance,
      });
    }

    const yearRecord = yearlyMap.get(currentYear)!;
    yearRecord.totalPayment += actualPaymentThisMonth;
    yearRecord.principalPaid += principalForMonth;
    yearRecord.interestPaid += interestForMonth;
    yearRecord.endingBalance = remainingBalance;
  }

  return {
    monthlyEmi: baseEmi,
    totalInterest: totalInterestAccumulator,
    totalPayment: totalPaymentAccumulator,
    actualMonths: monthCount,
    monthlySchedule,
    yearlySchedule: Array.from(yearlyMap.values()),
  };
}

export function exportRecordsToCSV(records: SavedEvaluationRecord[]) {
  if (!records.length) return;
  const headers = [
    'Date',
    'Loan Type',
    'Currency',
    'Monthly Income',
    'Loan Amount',
    'Tenure (Years)',
    'Credit Score',
    'Approval Probability (%)',
    'Decision Status',
    'Calculated EMI',
    'Proposed FOIR (%)',
  ];

  const rows = records.map((r) => [
    `"${new Date(r.timestamp).toLocaleString()}"`,
    `"${r.loanType}"`,
    `"${r.currency}"`,
    r.monthlyIncome,
    r.loanAmount,
    r.tenureYears,
    r.creditScore,
    r.approvalProbability,
    `"${r.decisionStatus}"`,
    r.calculatedEmi,
    r.proposedFOIR,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Loan_Evaluations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportRecordsToJSON(records: SavedEvaluationRecord[]) {
  const jsonContent = JSON.stringify(records, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Loan_Evaluations_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
