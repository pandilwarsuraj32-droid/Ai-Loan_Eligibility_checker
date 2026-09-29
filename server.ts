import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper to safely call Gemini or provide structured BFSI fallback
async function generateAIContent(prompt: string, systemInstruction: string) {
  if (!ai) {
    return null;
  }
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API execution error:', error);
    return null;
  }
}

// 1. AI Loan Eligibility Evaluation Endpoint
app.post('/api/ai/loan-eligibility', async (req: Request, res: Response) => {
  try {
    const {
      monthlyIncome = 5000,
      existingEmis = 800,
      loanAmount = 150000,
      tenureYears = 15,
      loanType = 'Home Loan',
      employmentType = 'Salaried',
      creditScore = 750,
      coApplicantIncome = 0,
      currency = '$',
    } = req.body;

    const totalIncome = Number(monthlyIncome) + Number(coApplicantIncome);
    const existingObligations = Number(existingEmis);
    const tenureMonths = Number(tenureYears) * 12;

    // Indicative interest rate based on loan type and credit score
    let baseRate = 8.5;
    if (loanType === 'Home Loan') baseRate = 7.2;
    else if (loanType === 'Personal Loan') baseRate = 12.5;
    else if (loanType === 'Auto Loan') baseRate = 8.0;
    else if (loanType === 'Education Loan') baseRate = 9.0;
    else if (loanType === 'Business Loan') baseRate = 13.5;

    // Credit score adjustment
    if (creditScore >= 800) baseRate -= 0.75;
    else if (creditScore >= 750) baseRate -= 0.35;
    else if (creditScore < 650) baseRate += 2.0;
    else if (creditScore < 600) baseRate += 4.0;

    // Mathematical EMI calculation
    const monthlyRate = baseRate / 12 / 100;
    const requestedAmount = Number(loanAmount);
    const calculatedEmi =
      monthlyRate === 0
        ? requestedAmount / tenureMonths
        : (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    // FOIR / DTI calculation (Fixed Obligation to Income Ratio)
    const proposedTotalObligations = existingObligations + calculatedEmi;
    const currentFOIR = totalIncome > 0 ? (existingObligations / totalIncome) * 100 : 0;
    const proposedFOIR = totalIncome > 0 ? (proposedTotalObligations / totalIncome) * 100 : 0;

    // Banking benchmark limits
    let maxAllowedFOIR = 50;
    if (loanType === 'Home Loan') maxAllowedFOIR = 55;
    if (totalIncome > 10000) maxAllowedFOIR += 5;

    // Max loan capacity by FOIR
    const maxDisposableForEmi = Math.max(0, totalIncome * (maxAllowedFOIR / 100) - existingObligations);
    const maxEligibleAmount =
      monthlyRate === 0
        ? maxDisposableForEmi * tenureMonths
        : (maxDisposableForEmi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) /
          (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));

    const prompt = `
Analyze this personal loan/credit application following BFSI underwriting guidelines:
- Monthly Net Income: ${currency}${totalIncome} (Base: ${currency}${monthlyIncome}, Co-applicant: ${currency}${coApplicantIncome})
- Existing Monthly Obligations / EMIs: ${currency}${existingObligations} (Current FOIR/DTI: ${currentFOIR.toFixed(1)}%)
- Requested Loan Type: ${loanType}
- Employment Type: ${employmentType}
- Requested Loan Amount: ${currency}${requestedAmount}
- Tenure: ${tenureYears} Years (${tenureMonths} Months)
- Credit Bureau Score: ${creditScore}
- Estimated Monthly EMI: ${currency}${calculatedEmi.toFixed(0)}
- Proposed FOIR/DTI after loan: ${proposedFOIR.toFixed(1)}% (Benchmark ceiling: ${maxAllowedFOIR}%)
- Estimated Mathematical Max Eligible Capacity: ${currency}${maxEligibleAmount.toFixed(0)}

Provide a strict, professional BFSI risk assessment output in JSON format with these exact fields:
{
  "approvalProbability": number (0 to 100),
  "decisionStatus": string ("Strongly Approved" | "Conditionally Approved" | "High Risk / Under Review" | "Declined"),
  "riskRating": string ("Low Risk (Prime)" | "Moderate Risk (Near-Prime)" | "Elevated Risk (Subprime)"),
  "estimatedInterestRate": number (e.g. 7.6),
  "recommendedMaxLoan": number,
  "summary": string (2-3 sentences of clear executive underwriting summary),
  "strengths": string[] (3 key positive factors),
  "riskFactors": string[] (2-3 potential red flags or concerns),
  "lenderMatch": {
    "recommendedLenderTypes": string[] (e.g. "Tier 1 PSU & Private Banks", "Specialized NBFCs", "Fintech Digital Lenders"),
    "estimatedProcessingTime": string (e.g. "2 to 4 Business Days"),
    "documentationLevel": string ("Standard KYC & 6M Bank Statements" | "Comprehensive Income & Tax ITR" | "Collateral Verification Required")
  },
  "actionPlan": string[] (3 actionable steps the applicant can take to increase approval or get lower interest rates)
}`;

    const systemInstruction =
      'You are a Senior Chief Underwriting Officer & BFSI Risk Management System. Deliver precise, mathematically sound, realistic banking assessments based on real global lending norms (DTI/FOIR limits, credit tiers, income stability). Format the response as valid JSON only.';

    const aiResponseText = await generateAIContent(prompt, systemInstruction);

    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        return res.json({
          success: true,
          source: 'gemini-3.8-flash',
          metrics: {
            calculatedEmi: Math.round(calculatedEmi),
            proposedFOIR: Number(proposedFOIR.toFixed(1)),
            currentFOIR: Number(currentFOIR.toFixed(1)),
            maxEligibleAmount: Math.round(maxEligibleAmount),
            indicativeRate: Number(baseRate.toFixed(2)),
          },
          ...parsed,
        });
      } catch (parseError) {
        console.warn('AI JSON parsing error, returning deterministic evaluation', parseError);
      }
    }

    // Deterministic BFSI Fallback calculation if AI unavailable
    let approvalProbability = 50;
    if (proposedFOIR <= 35 && creditScore >= 750) approvalProbability = 94;
    else if (proposedFOIR <= 45 && creditScore >= 700) approvalProbability = 82;
    else if (proposedFOIR <= 55 && creditScore >= 650) approvalProbability = 65;
    else if (proposedFOIR > 60 || creditScore < 600) approvalProbability = 32;

    const decisionStatus =
      approvalProbability >= 80
        ? 'Strongly Approved'
        : approvalProbability >= 60
        ? 'Conditionally Approved'
        : approvalProbability >= 40
        ? 'High Risk / Under Review'
        : 'Declined';

    return res.json({
      success: true,
      source: 'bfsi-underwriting-engine',
      metrics: {
        calculatedEmi: Math.round(calculatedEmi),
        proposedFOIR: Number(proposedFOIR.toFixed(1)),
        currentFOIR: Number(currentFOIR.toFixed(1)),
        maxEligibleAmount: Math.round(maxEligibleAmount),
        indicativeRate: Number(baseRate.toFixed(2)),
      },
      approvalProbability,
      decisionStatus,
      riskRating:
        creditScore >= 750 && proposedFOIR <= 45
          ? 'Low Risk (Prime)'
          : creditScore >= 670
          ? 'Moderate Risk (Near-Prime)'
          : 'Elevated Risk (Subprime)',
      estimatedInterestRate: Number(baseRate.toFixed(2)),
      recommendedMaxLoan: Math.round(Math.min(requestedAmount, maxEligibleAmount)),
      summary: `Based on your debt-to-income ratio of ${proposedFOIR.toFixed(1)}% and credit score of ${creditScore}, your profile meets ${decisionStatus.toLowerCase()} criteria for ${loanType}.`,
      strengths: [
        creditScore >= 720 ? 'Strong credit score indicative of disciplined repayment history' : 'Active employment and recurring monthly cashflow',
        proposedFOIR <= 45 ? 'Healthy debt-to-income ratio within prime bank safety margins' : 'Tenure length provides manageable debt servicing',
        totalIncome >= 4000 ? 'Stable verified monthly income base' : 'Regular income supports proposed obligations',
      ],
      riskFactors: [
        proposedFOIR > 45 ? `Proposed FOIR (${proposedFOIR.toFixed(1)}%) is above the optimal 40% threshold` : 'Subject to property / asset valuation check',
        creditScore < 700 ? 'Score below 700 may attract a risk-based rate premium' : 'Market interest rate fluctuations could impact floating rate loans',
      ],
      lenderMatch: {
        recommendedLenderTypes:
          creditScore >= 740 && proposedFOIR <= 45
            ? ['Top-Tier Retail Banks', 'Leading Housing Finance Companies']
            : ['Non-Banking Financial Companies (NBFCs)', 'Digital FinTech Lenders'],
        estimatedProcessingTime: creditScore >= 740 ? '24 - 48 Hours' : '3 - 5 Business Days',
        documentationLevel: employmentType === 'Salaried' ? 'Standard KYC, 3M Payslips & 6M Bank Statements' : 'Comprehensive 2-Year ITR, P&L, and GST Filings',
      },
      actionPlan: [
        proposedFOIR > 40 ? 'Prepay smaller revolving credit lines or personal loans to lower your monthly FOIR below 40%.' : 'Negotiate interest rate concessions and processing fee waivers with Tier 1 banks.',
        coApplicantIncome === 0 ? 'Adding an earning co-applicant (spouse or parent) can boost eligible loan quantum by 30-50%.' : 'Maintain current debt levels until sanction disbursement.',
        'Avoid making multiple hard loan inquiries simultaneously to protect your credit score.',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Underwriting evaluation error' });
  }
});

// 2. AI Credit Score Analyzer Endpoint
app.post('/api/ai/credit-analyzer', async (req: Request, res: Response) => {
  try {
    const {
      creditScore = 720,
      paymentHistory = 96,
      creditUtilization = 34,
      creditAgeYears = 4.2,
      totalAccounts = 5,
      hardInquiriesLast12M = 2,
    } = req.body;

    const prompt = `
Analyze this borrower credit bureau file using standard credit scoring models (FICO / VantageScore / CIBIL):
- Current Score: ${creditScore} / 850 or 900
- Payment History: ${paymentHistory}% on-time payments (Standard weight ~35%)
- Credit Utilization: ${creditUtilization}% of available revolving limits (Standard weight ~30%, ideal is <30%, optimal <10%)
- Average Credit Age: ${creditAgeYears} Years (Standard weight ~15%)
- Active Account Mix: ${totalAccounts} accounts (Standard weight ~10%)
- Hard Inquiries in Last 12 Months: ${hardInquiriesLast12M} (Standard weight ~10%)

Return a structured JSON with:
{
  "scoreCategory": string ("Exceptional" | "Very Good" | "Good" | "Fair" | "Poor"),
  "healthScore": number (0 to 100),
  "potentialPointGain": number (e.g. 35 to 80),
  "primaryBottleneck": string (the single biggest factor pulling the score down),
  "factorBreakdown": [
    {
      "factor": "Payment History",
      "impact": "High" | "Medium" | "Low",
      "status": "Optimal" | "Satisfactory" | "Needs Attention" | "Critical",
      "commentary": string
    },
    {
      "factor": "Credit Utilization",
      "impact": "High" | "Medium" | "Low",
      "status": "Optimal" | "Satisfactory" | "Needs Attention" | "Critical",
      "commentary": string
    },
    {
      "factor": "Credit Age & History",
      "impact": "Medium" | "Low",
      "status": "Optimal" | "Satisfactory" | "Needs Attention",
      "commentary": string
    },
    {
      "factor": "Credit Mix",
      "impact": "Low",
      "status": "Optimal" | "Satisfactory" | "Needs Attention",
      "commentary": string
    },
    {
      "factor": "Inquiries",
      "impact": "Low" | "Medium",
      "status": "Optimal" | "Satisfactory" | "Needs Attention",
      "commentary": string
    }
  ],
  "roadmap": {
    "day30": string (immediate quick win),
    "day60": string (mid-term habit/paydown),
    "day90": string (long-term compounding score booster)
  },
  "proTips": string[] (3 strategic credit tips tailored to this profile)
}`;

    const systemInstruction =
      'You are a Certified Credit Bureau Specialist and Financial Analyst. Provide deep, accurate diagnostic insights based on real FICO and credit algorithm weights. Return pure JSON only.';

    const aiResponseText = await generateAIContent(prompt, systemInstruction);

    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        return res.json({
          success: true,
          source: 'gemini-3.8-flash',
          ...parsed,
        });
      } catch (err) {
        console.warn('Failed parsing credit analyzer AI response', err);
      }
    }

    // High quality deterministic fallback
    let category = 'Good';
    if (creditScore >= 800) category = 'Exceptional';
    else if (creditScore >= 740) category = 'Very Good';
    else if (creditScore >= 670) category = 'Good';
    else if (creditScore >= 580) category = 'Fair';
    else category = 'Poor';

    return res.json({
      success: true,
      source: 'bfsi-credit-rules-engine',
      scoreCategory: category,
      healthScore: Math.round((creditScore / 850) * 100),
      potentialPointGain: creditUtilization > 30 ? 45 : 25,
      primaryBottleneck:
        creditUtilization > 30
          ? `Credit utilization of ${creditUtilization}% exceeds the recommended 30% ceiling`
          : paymentHistory < 99
          ? 'Missed or delayed payment occurrences on historical records'
          : 'Relatively short credit history depth',
      factorBreakdown: [
        {
          factor: 'Payment History',
          impact: 'High',
          status: paymentHistory >= 98 ? 'Optimal' : paymentHistory >= 95 ? 'Satisfactory' : 'Needs Attention',
          commentary: `${paymentHistory}% on-time rate. Even a single 30-day delinquency can drop a score by 40-70 points.`,
        },
        {
          factor: 'Credit Utilization',
          impact: 'High',
          status: creditUtilization <= 10 ? 'Optimal' : creditUtilization <= 30 ? 'Satisfactory' : 'Needs Attention',
          commentary: `Currently at ${creditUtilization}%. Reducing revolving card balances below 10% can trigger rapid score rebounds.`,
        },
        {
          factor: 'Credit Age & History',
          impact: 'Medium',
          status: creditAgeYears >= 5 ? 'Optimal' : 'Satisfactory',
          commentary: `${creditAgeYears} years average age. Keep oldest accounts active to preserve account longevity.`,
        },
        {
          factor: 'Credit Mix',
          impact: 'Low',
          status: totalAccounts >= 4 ? 'Optimal' : 'Satisfactory',
          commentary: 'Balanced portfolio between revolving lines (cards) and installment term loans.',
        },
        {
          factor: 'Recent Inquiries',
          impact: 'Low',
          status: hardInquiriesLast12M <= 1 ? 'Optimal' : hardInquiriesLast12M <= 3 ? 'Satisfactory' : 'Needs Attention',
          commentary: `${hardInquiriesLast12M} hard pulls in 12 months. Inquiries remain on bureau reports for 24 months.`,
        },
      ],
      roadmap: {
        day30: 'Pay down highest-utilization credit card before the next billing cycle statement generation date.',
        day60: 'Request a credit limit increase on existing cards without a hard pull to instantly decrease your utilization ratio.',
        day90: 'Ensure 100% autopay on all utilities and cards, eliminating any possibility of late marks.',
      },
      proTips: [
        'Pay twice a month: Make a mid-cycle payment to keep reported statement balances low.',
        'Never close your oldest zero-fee credit card; closing it reduces total limit and shrinks credit history age.',
        'Space credit applications by at least 6 months to prevent inquiry clustering flags.',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Credit analysis error' });
  }
});

// 3. AI EMI Optimizer & Prepayment Simulator Endpoint
app.post('/api/ai/emi-optimizer', async (req: Request, res: Response) => {
  try {
    const {
      loanAmount = 100000,
      interestRate = 8.5,
      tenureYears = 15,
      monthlyIncome = 5000,
      currency = '$',
    } = req.body;

    const P = Number(loanAmount);
    const r = Number(interestRate) / 12 / 100;
    const n = Number(tenureYears) * 12;
    const baseEmi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = baseEmi * n;
    const totalInterest = totalPayment - P;

    const prompt = `
Evaluate this loan amortization optimization case:
- Principal Loan: ${currency}${P}
- Annual Interest Rate: ${interestRate}%
- Loan Tenure: ${tenureYears} Years (${n} Months)
- Monthly EMI: ${currency}${baseEmi.toFixed(2)}
- Total Lifetime Interest without intervention: ${currency}${totalInterest.toFixed(2)}
- Borrower Income: ${currency}${monthlyIncome}/mo

Provide a financial optimization plan in JSON:
{
  "keyTakeaway": string,
  "prepaymentScenarios": [
    {
      "name": "Scenario A: 10% Extra Monthly Payment",
      "monthlyExtra": number,
      "estimatedInterestSaved": number,
      "monthsSaved": number,
      "feasibility": "High" | "Medium"
    },
    {
      "name": "Scenario B: One Extra EMI Annually (Bonus Paydown)",
      "annualLumpSum": number,
      "estimatedInterestSaved": number,
      "monthsSaved": number,
      "feasibility": "High" | "Medium"
    }
  ],
  "refinancingVerdict": {
    "isRefinancingRecommended": boolean,
    "breakEvenRateDifference": number (in %),
    "reasoning": string
  },
  "taxAndWealthAdvice": string[] (2-3 strategic tips on tax deductions, liquidity buffer vs loan prepay)
}`;

    const systemInstruction =
      'You are a Senior Quantitative BFSI Wealth Advisor. Compute realistic interest savings and compounding impacts. Return valid JSON only.';

    const aiResponseText = await generateAIContent(prompt, systemInstruction);

    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        return res.json({
          success: true,
          source: 'gemini-3.8-flash',
          baseStats: {
            baseEmi: Math.round(baseEmi),
            totalInterest: Math.round(totalInterest),
            totalPayment: Math.round(totalPayment),
          },
          ...parsed,
        });
      } catch (err) {
        console.warn('Failed parsing EMI optimizer AI response', err);
      }
    }

    // Deterministic fallback calculations
    const extraTenPercentEmi = baseEmi * 0.1;
    const approxInterestSavedA = totalInterest * 0.22;
    const approxMonthsSavedA = Math.round(n * 0.2);

    return res.json({
      success: true,
      source: 'bfsi-amortization-engine',
      baseStats: {
        baseEmi: Math.round(baseEmi),
        totalInterest: Math.round(totalInterest),
        totalPayment: Math.round(totalPayment),
      },
      keyTakeaway: `Paying just 10% more each month saves approximately ${currency}${Math.round(approxInterestSavedA).toLocaleString()} in pure interest and closes your loan ${Math.round(approxMonthsSavedA / 12)} years early!`,
      prepaymentScenarios: [
        {
          name: 'Scenario A: 10% Extra Monthly Payment',
          monthlyExtra: Math.round(extraTenPercentEmi),
          estimatedInterestSaved: Math.round(approxInterestSavedA),
          monthsSaved: approxMonthsSavedA,
          feasibility: 'High',
        },
        {
          name: 'Scenario B: One Extra EMI Annually (Bonus Paydown)',
          annualLumpSum: Math.round(baseEmi),
          estimatedInterestSaved: Math.round(totalInterest * 0.17),
          monthsSaved: Math.round(n * 0.16),
          feasibility: 'High',
        },
      ],
      refinancingVerdict: {
        isRefinancingRecommended: interestRate > 9.5,
        breakEvenRateDifference: 0.75,
        reasoning:
          interestRate > 9.5
            ? 'Your current rate is higher than prevailing market benchmarks. A balance transfer could yield significant savings.'
            : 'Your current interest rate is already competitive. The switching/origination fees might outweigh refinancing gains unless a rate drop exceeding 0.75% is secured.',
      },
      taxAndWealthAdvice: [
        'Maintain a 6-month liquid emergency fund before allocating surplus liquidity to loan prepayments.',
        'Review available tax exemptions on mortgage interest (e.g. IRS Section 163(h) or Indian Section 24b) to compute post-tax effective borrowing costs.',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'EMI optimization error' });
  }
});

// 4. AI Financial Tips & Advisor Endpoint
app.post('/api/ai/financial-tips', async (req: Request, res: Response) => {
  try {
    const { category = 'all', profile = {}, userQuery = '' } = req.body;

    const prompt = `
You are an executive BFSI AI Financial Advisor. Provide deep, high-value, actionable personal financial advice.
Target Category: ${category}
User Profile (if available):
- Monthly Income: ${profile.monthlyIncome || 'Standard middle-income'}
- Existing EMIs: ${profile.existingEmis || 'Moderate'}
- Credit Score: ${profile.creditScore || '720'}
- Loan of Interest: ${profile.loanType || 'Personal/Home Loan'}
User Specific Question (if provided): "${userQuery}"

Provide a JSON response with:
{
  "headline": string,
  "coreAdvice": string (comprehensive 3-4 sentence strategic guidance),
  "actionablePillars": [
    {
      "pillar": string (e.g. "Debt Snowball & Restructuring"),
      "description": string,
      "impact": "High" | "Critical" | "Growth"
    },
    {
      "pillar": string (e.g. "Liquidity & Safety Buffer"),
      "description": string,
      "impact": "High" | "Critical" | "Growth"
    },
    {
      "pillar": string (e.g. "Credit Optimization"),
      "description": string,
      "impact": "High" | "Critical" | "Growth"
    }
  ],
  "goldenRules": string[] (3 non-negotiable rules of thumb for borrowing and personal finance),
  "suggestedNextQuestions": string[] (3 relevant follow-up questions the user can ask)
}`;

    const systemInstruction =
      'You are a seasoned BFSI financial planner and credit risk strategist. Give practical, mathematically sound, ethical advice. Never give speculative gambling advice. Return valid JSON only.';

    const aiResponseText = await generateAIContent(prompt, systemInstruction);

    if (aiResponseText) {
      try {
        const parsed = JSON.parse(aiResponseText);
        return res.json({
          success: true,
          source: 'gemini-3.8-flash',
          ...parsed,
        });
      } catch (err) {
        console.warn('Failed parsing financial tips AI response', err);
      }
    }

    // High quality deterministic fallback
    return res.json({
      success: true,
      source: 'bfsi-advisory-engine',
      headline: 'Prudent Debt Management & Wealth Preservation Blueprint',
      coreAdvice:
        'Keep your total monthly debt obligations under 40% of net post-tax income. Always build a liquid 3-to-6 month emergency safety cushion before aggressively accelerating loan prepayments or taking on speculative obligations.',
      actionablePillars: [
        {
          pillar: 'The 28/36 Rule of Borrowing',
          description:
            'Never spend more than 28% of your gross income on housing debts, and no more than 36% on total debt (housing + cards + student/car loans).',
          impact: 'Critical',
        },
        {
          pillar: 'Revolving Debt Elimination First',
          description:
            'High-interest credit cards (24-36% APR) destroy compounding wealth. Prioritize eradicating unsecured high-APR debts before focusing on low-cost mortgages.',
          impact: 'High',
        },
        {
          pillar: 'Prepayment Scheduling',
          description:
            'Prepaying principal during the first 3-5 years of a long-term loan saves up to 4x more interest than prepaying in later years due to amortization curve mechanics.',
          impact: 'Growth',
        },
      ],
      goldenRules: [
        'Never borrow to fund depreciating lifestyle luxury expenses.',
        'Check your credit bureau report every 90 days for fraudulent or erroneous reporting.',
        'Ensure loan tenure aligns with the useful economic life of the financed asset.',
      ],
      suggestedNextQuestions: [
        'Should I use an emergency fund to pay off personal loans?',
        'How does a floating interest rate differ from a fixed rate?',
        'What is the difference between debt avalanche and debt snowball?',
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Financial tips generation error' });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiEnabled: Boolean(ai),
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
