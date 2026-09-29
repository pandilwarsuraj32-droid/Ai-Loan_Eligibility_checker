export type CurrencyCode = '$' | '₹' | '€' | '£' | 'A$' | 'C$' | '¥';

export interface LoanInputState {
  monthlyIncome: number;
  existingEmis: number;
  loanAmount: number;
  tenureYears: number;
  loanType: string;
  employmentType: string;
  creditScore: number;
  coApplicantIncome: number;
  currency: CurrencyCode;
}

export interface LoanUnderwritingResult {
  source?: string;
  metrics: {
    calculatedEmi: number;
    proposedFOIR: number;
    currentFOIR: number;
    maxEligibleAmount: number;
    indicativeRate: number;
  };
  approvalProbability: number;
  decisionStatus: 'Strongly Approved' | 'Conditionally Approved' | 'High Risk / Under Review' | 'Declined';
  riskRating: string;
  estimatedInterestRate: number;
  recommendedMaxLoan: number;
  summary: string;
  strengths: string[];
  riskFactors: string[];
  lenderMatch: {
    recommendedLenderTypes: string[];
    estimatedProcessingTime: string;
    documentationLevel: string;
  };
  actionPlan: string[];
  evaluatedAt?: string;
}

export interface CreditAnalyzerState {
  creditScore: number;
  paymentHistory: number; // percentage (e.g. 98)
  creditUtilization: number; // percentage (e.g. 28)
  creditAgeYears: number; // years (e.g. 5.5)
  totalAccounts: number; // count
  hardInquiriesLast12M: number; // count
}

export interface CreditAnalyzerResult {
  source?: string;
  scoreCategory: string;
  healthScore: number;
  potentialPointGain: number;
  primaryBottleneck: string;
  factorBreakdown: {
    factor: string;
    impact: 'High' | 'Medium' | 'Low';
    status: 'Optimal' | 'Satisfactory' | 'Needs Attention' | 'Critical';
    commentary: string;
  }[];
  roadmap: {
    day30: string;
    day60: string;
    day90: string;
  };
  proTips: string[];
}

export interface EmiPrepaymentScenario {
  name: string;
  monthlyExtra?: number;
  annualLumpSum?: number;
  estimatedInterestSaved: number;
  monthsSaved: number;
  feasibility: 'High' | 'Medium';
}

export interface EmiOptimizerResult {
  source?: string;
  baseStats: {
    baseEmi: number;
    totalInterest: number;
    totalPayment: number;
  };
  keyTakeaway: string;
  prepaymentScenarios: EmiPrepaymentScenario[];
  refinancingVerdict: {
    isRefinancingRecommended: boolean;
    breakEvenRateDifference: number;
    reasoning: string;
  };
  taxAndWealthAdvice: string[];
}

export interface FinancialTipResponse {
  headline: string;
  coreAdvice: string;
  actionablePillars: {
    pillar: string;
    description: string;
    impact: 'Critical' | 'High' | 'Growth';
  }[];
  goldenRules: string[];
  suggestedNextQuestions: string[];
}

export interface SavedEvaluationRecord {
  id: string;
  timestamp: string;
  loanType: string;
  currency: CurrencyCode;
  monthlyIncome: number;
  loanAmount: number;
  tenureYears: number;
  creditScore: number;
  approvalProbability: number;
  decisionStatus: string;
  calculatedEmi: number;
  proposedFOIR: number;
}
