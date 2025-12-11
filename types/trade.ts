export interface ChecklistItem {
  id: string;
  label: string;
  type: "checkbox" | "text";
  required?: boolean;
}

export interface Checklist {
  H1_TrendAligned: boolean;
  M15_TrendAligned: boolean;
  M05_StructureMet: boolean;
  Confirmations: string;
  ExitRuleFollowed: boolean;
  // Allow additional dynamic checklist items
  [key: string]: boolean | string;
}

export interface Strategy {
  id?: string;
  userId: string;
  name: string;
  checklistItems: ChecklistItem[];
  confirmationsPlaceholder?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Trade {
  id?: string;
  userId: string;
  asset: string;
  strategyId: string; // Now supports dynamic strategies
  direction: "Long" | "Short";
  entryTime: Date | string;
  exitTime: Date | string;
  optionEntryPrice: number;
  optionExitPrice: number;
  positionSize: number;
  stopLossPrice?: number;
  initialRisk: number;
  initialReward: number;
  realizedPnL: number;
  realizedRR: number;
  expectedRR?: number;
  exitReason: "SL Hit" | "TP Hit" | "Manual" | "Time Limit";
  emotionalState: "Calm" | "Greedy" | "Fearful" | "Rushed" | "Revenge";
  isAdherent: boolean;
  checklist: Checklist;

  // --- Time-based analysis helpers (derived per-trade, used for analytics) ---
  entryHour?: number; // 0-23 local hour at entry
  dayOfWeek?: number; // 0 (Sunday) - 6 (Saturday)
  timeInTradeMinutes?: number;

  // --- Trade performance tracking ---
  maxFavorableExcursion?: number; // in ₹
  maxAdverseExcursion?: number; // in ₹
  peakProfit?: number; // in ₹
  timeToPeakMinutes?: number;

  // --- Market conditions ---
  volatility?: "Low" | "Medium" | "High";
  trendH1?: "Bullish" | "Bearish" | "Sideways";
  trendM15?: "Bullish" | "Bearish" | "Sideways";
  trendM5?: "Bullish" | "Bearish" | "Sideways";
  volumeProfile?: "Low" | "Normal" | "High";

  // --- Trade quality & psychology ---
  confidenceLevel?: number; // 1-10
  setupQuality?: number; // 1-10
  tradeNumber?: number; // sequence within the day
  winStreak?: number;
  lossStreak?: number;
  accountBalance?: number;
  fundAccountId?: string; // Reference to fund account used for this trade

  // --- Strategy refinement ---
  partialExit?: boolean;
  trailingStopUsed?: boolean;
  breakevenMoved?: boolean;

  // --- Review & learning ---
  lessonsLearned?: string;
  wouldTradeAgain?: boolean;
  mistakes?: string;
  whatWorked?: string;

  // --- Risk management extras ---
  riskPercent?: number; // % of account at risk
  positionSizePercent?: number; // % of account in position
  maxDrawdown?: number; // worst unrealized loss during trade (₹)
}

export interface TradeFilters {
  strategyId?: string | "";
  direction?: "Long" | "Short" | "";
  isAdherent?: boolean | "";
  startDate?: string;
  endDate?: string;
  fundAccountId?: string | "";
}

export interface TradeMetrics {
  totalTrades: number;
  overallPnL: number;
  winRate: number;
  averageRR: number;
  expectancy: number;
  adherenceRate: number;
}

export interface FundAccount {
  id?: string;
  userId: string;
  name: string;
  balance: number;
  initialBalance: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

