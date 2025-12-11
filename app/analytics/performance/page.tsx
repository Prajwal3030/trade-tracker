"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TradeFilters from "@/components/TradeFilters";
import { getTrades } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";
import { useAuth } from "@/components/AuthProvider";
import { getFundAccounts } from "@/lib/fundAccounts";

interface StreakStats {
  bestWinStreak: number;
  worstLossStreak: number;
  currentWinStreak: number;
  currentLossStreak: number;
}

interface RiskSummary {
  avgRiskPercent: number;
  avgPositionPercent: number;
  avgDrawdown: number;
  maxDrawdown: number;
  peakAccount: number;
  bottomAccount: number;
}

interface LossInsights {
  mostCommonMistakes: Array<{ mistake: string; count: number }>;
  confidenceWithMostLosses: number | null;
  setupQualityWithMostLosses: number | null;
  tradeNumberWithMostLosses: number | null;
}

function summarizeStreaks(trades: Trade[]): StreakStats {
  if (trades.length === 0) {
    return {
      bestWinStreak: 0,
      worstLossStreak: 0,
      currentWinStreak: 0,
      currentLossStreak: 0,
    };
  }

  // work from oldest to newest
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  let winStreak = 0;
  let lossStreak = 0;
  let bestWinStreak = 0;
  let worstLossStreak = 0;

  sorted.forEach((trade) => {
    if (trade.realizedPnL > 0) {
      winStreak += 1;
      lossStreak = 0;
    } else if (trade.realizedPnL < 0) {
      lossStreak += 1;
      winStreak = 0;
    } else {
      // breakeven: do not change streaks
    }

    if (winStreak > bestWinStreak) bestWinStreak = winStreak;
    if (lossStreak > worstLossStreak) worstLossStreak = lossStreak;
  });

  return {
    bestWinStreak,
    worstLossStreak,
    currentWinStreak: winStreak,
    currentLossStreak: lossStreak,
  };
}

function summarizeRisk(trades: Trade[], fundAccounts: FundAccount[]): RiskSummary {
  if (trades.length === 0) {
    return {
      avgRiskPercent: 0,
      avgPositionPercent: 0,
      avgDrawdown: 0,
      maxDrawdown: 0,
      peakAccount: 0,
      bottomAccount: 0,
    };
  }

  const withRisk = trades.filter(
    (t) =>
      typeof t.riskPercent === "number" &&
      typeof t.positionSizePercent === "number" &&
      t.fundAccountId
  );

  if (withRisk.length === 0) {
    return {
      avgRiskPercent: 0,
      avgPositionPercent: 0,
      avgDrawdown: 0,
      maxDrawdown: 0,
      peakAccount: 0,
      bottomAccount: 0,
    };
  }

  const totalRisk = withRisk.reduce(
    (sum, t) => sum + (t.riskPercent ?? 0),
    0
  );
  const totalPos = withRisk.reduce(
    (sum, t) => sum + (t.positionSizePercent ?? 0),
    0
  );

  // Map fund accounts for initial balances
  const accountMap = new Map<string, FundAccount>();
  fundAccounts.forEach((fa) => {
    if (fa.id) accountMap.set(fa.id, fa);
  });

  // Group trades by fund account and calculate equity curve for each
  const accountGroups = new Map<string, Trade[]>();
  withRisk.forEach((t) => {
    if (t.fundAccountId) {
      if (!accountGroups.has(t.fundAccountId)) {
        accountGroups.set(t.fundAccountId, []);
      }
      accountGroups.get(t.fundAccountId)!.push(t);
    }
  });

  // Calculate account-level metrics
  let totalDrawdown = 0;
  let maxDrawdown = 0;
  let peakAccount = 0;
  let bottomAccount = Infinity;
  let drawdownCount = 0;

  // Process each account separately
  for (const [accountId, accountTrades] of accountGroups.entries()) {
    // Sort trades chronologically
    const sortedTrades = [...accountTrades].sort(
      (a, b) =>
        new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
    );

    // Get initial balance from fund account; fallback to first trade balance
    const firstTrade = sortedTrades[0];
    const fund = firstTrade.fundAccountId
      ? accountMap.get(firstTrade.fundAccountId)
      : undefined;
    let currentBalance =
      fund?.initialBalance ??
      firstTrade.accountBalance ??
      0;

    let peakEquity = currentBalance;
    let bottomEquity = currentBalance;

    // Build equity curve using sequential balances
    sortedTrades.forEach((t) => {
      const entryBalance = currentBalance;
      const exitBalance = entryBalance + (t.realizedPnL ?? 0);
      
      // Update peak and bottom
      peakEquity = Math.max(peakEquity, entryBalance, exitBalance);
      bottomEquity = Math.min(bottomEquity, entryBalance, exitBalance);
      
      // Calculate drawdown from peak (cannot exceed peak)
      const drawdown = Math.max(0, peakEquity - exitBalance);
      const validDrawdown = drawdown;
      
      if (validDrawdown > 0) {
        totalDrawdown += validDrawdown;
        drawdownCount++;
        maxDrawdown = Math.max(maxDrawdown, validDrawdown);
      }
      
      currentBalance = exitBalance;
    });

    // Track overall peak and bottom across all accounts
    peakAccount = Math.max(peakAccount, peakEquity);
    bottomAccount = Math.min(bottomAccount, bottomEquity);
  }

  const avgDrawdown =
    drawdownCount > 0
      ? Number((totalDrawdown / drawdownCount).toFixed(2))
      : 0;

  const n = withRisk.length;

  return {
    avgRiskPercent: Number((totalRisk / n).toFixed(2)),
    avgPositionPercent: Number((totalPos / n).toFixed(2)),
    avgDrawdown: avgDrawdown,
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    peakAccount: peakAccount === Infinity ? 0 : Number(peakAccount.toFixed(2)),
    bottomAccount: bottomAccount === Infinity ? 0 : Number(bottomAccount.toFixed(2)),
  };
}

function analyzeLossInsights(trades: Trade[]): LossInsights {
  if (trades.length === 0) {
    return {
      mostCommonMistakes: [],
      confidenceWithMostLosses: null,
      setupQualityWithMostLosses: null,
      tradeNumberWithMostLosses: null,
    };
  }

  // Filter losing trades
  const losingTrades = trades.filter((t) => t.realizedPnL < 0);

  if (losingTrades.length === 0) {
    return {
      mostCommonMistakes: [],
      confidenceWithMostLosses: null,
      setupQualityWithMostLosses: null,
      tradeNumberWithMostLosses: null,
    };
  }

  // Analyze most common mistakes
  const mistakeCounts = new Map<string, number>();
  losingTrades.forEach((t) => {
    if (t.mistakes && t.mistakes.trim()) {
      // Split by common delimiters and count each mistake
      const mistakes = t.mistakes
        .split(/[,;|\n]/)
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      mistakes.forEach((mistake) => {
        mistakeCounts.set(mistake, (mistakeCounts.get(mistake) || 0) + 1);
      });
    }
  });

  const mostCommonMistakes = Array.from(mistakeCounts.entries())
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 most common mistakes

  // Analyze confidence levels
  const confidenceCounts = new Map<number, number>();
  losingTrades.forEach((t) => {
    if (typeof t.confidenceLevel === "number") {
      confidenceCounts.set(
        t.confidenceLevel,
        (confidenceCounts.get(t.confidenceLevel) || 0) + 1
      );
    }
  });

  const confidenceWithMostLosses =
    confidenceCounts.size > 0
      ? Array.from(confidenceCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0][0]
      : null;

  // Analyze setup quality
  const setupQualityCounts = new Map<number, number>();
  losingTrades.forEach((t) => {
    if (typeof t.setupQuality === "number") {
      setupQualityCounts.set(
        t.setupQuality,
        (setupQualityCounts.get(t.setupQuality) || 0) + 1
      );
    }
  });

  const setupQualityWithMostLosses =
    setupQualityCounts.size > 0
      ? Array.from(setupQualityCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0][0]
      : null;

  // Analyze trade numbers
  const tradeNumberCounts = new Map<number, number>();
  losingTrades.forEach((t) => {
    if (typeof t.tradeNumber === "number") {
      tradeNumberCounts.set(
        t.tradeNumber,
        (tradeNumberCounts.get(t.tradeNumber) || 0) + 1
      );
    }
  });

  const tradeNumberWithMostLosses =
    tradeNumberCounts.size > 0
      ? Array.from(tradeNumberCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0][0]
      : null;

  return {
    mostCommonMistakes,
    confidenceWithMostLosses,
    setupQualityWithMostLosses,
    tradeNumberWithMostLosses,
  };
}

export default function PerformanceAnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const loadTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setFundAccounts([]);
      return;
    }

    setIsLoading(true);
    try {
      const [fetchedTrades, fetchedAccounts] = await Promise.all([
        getTrades(filters, user.uid),
        getFundAccounts(user.uid),
      ]);
      setTrades(fetchedTrades);
      setFundAccounts(fetchedAccounts);
    } catch (error) {
      console.error("Error loading trades or fund accounts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      loadTrades();
    }
  }, [loading, user, loadTrades, router]);

  const streaks = useMemo(() => summarizeStreaks(trades), [trades]);
  const risk = useMemo(() => summarizeRisk(trades, fundAccounts), [trades, fundAccounts]);
  const lossInsights = useMemo(() => analyzeLossInsights(trades), [trades]);

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <button
          onClick={() => router.push("/analytics")}
          className="mb-4 text-amber-400 hover:text-amber-300 flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analytics
        </button>
        <TradeFilters filters={filters} onFilterChange={setFilters} />

        {isLoading && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4 animate-pulse">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Loading trades...</p>
          </div>
        )}

        {!isLoading && trades.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-purple-200 bg-clip-text text-transparent">
                Performance Summary
              </h2>
            </div>

            {/* Streaks */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Streaks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                    </svg>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Current Streak
                    </div>
                  </div>
                  <div className="text-xl font-bold">
                    {streaks.currentWinStreak > 0 && (
                      <span className="text-green-400">
                        {streaks.currentWinStreak} win{streaks.currentWinStreak > 1 ? "s" : ""}
                      </span>
                    )}
                    {streaks.currentLossStreak > 0 && (
                      <span className="text-red-400">
                        {streaks.currentLossStreak} loss{streaks.currentLossStreak > 1 ? "es" : ""}
                      </span>
                    )}
                    {streaks.currentWinStreak === 0 && streaks.currentLossStreak === 0 && (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-green-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Best Win Streak
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-400">
                    {streaks.bestWinStreak} trade{streaks.bestWinStreak === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Worst Loss Streak
                    </div>
                  </div>
                  <div className="text-xl font-bold text-red-400">
                    {streaks.worstLossStreak} trade{streaks.worstLossStreak === 1 ? "" : "s"}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk Management */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Risk Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-gray-700/50 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Avg Risk %
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {risk.avgRiskPercent}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-gray-700/50 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Avg Position %
                  </div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {risk.avgPositionPercent}%
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Avg Drawdown
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    ₹{risk.avgDrawdown}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Max Drawdown
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    ₹{risk.maxDrawdown}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Peak & Bottom */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Account Equity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-green-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Peak of Account
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ₹{risk.peakAccount}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Bottom Point of Account
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    ₹{risk.bottomAccount}
                  </div>
                </div>
              </div>
            </div>

            {/* Loss Insights */}
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Loss Analysis</h3>
              
              {/* Most Common Mistakes */}
              {lossInsights.mostCommonMistakes.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    Most Common Mistakes
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lossInsights.mostCommonMistakes.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-4 border border-red-500/20 backdrop-blur-sm"
                      >
                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">
                          {item.mistake}
                        </div>
                        <div className="text-lg font-bold text-red-400">
                          {item.count} time{item.count > 1 ? "s" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loss Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Most Losses at Confidence Level
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {lossInsights.confidenceWithMostLosses !== null
                      ? lossInsights.confidenceWithMostLosses
                      : "N/A"}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Most Losses at Setup Quality
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {lossInsights.setupQualityWithMostLosses !== null
                      ? lossInsights.setupQualityWithMostLosses
                      : "N/A"}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                    Most Losses at Trade # (Daily)
                  </div>
                  <div className="text-2xl font-bold text-red-400">
                    {lossInsights.tradeNumberWithMostLosses !== null
                      ? `#${lossInsights.tradeNumberWithMostLosses}`
                      : "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && trades.length === 0 && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No trades found. Start logging trades to see performance analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
}


