"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "@/components/Dashboard";
import TradeFilters from "@/components/TradeFilters";
import { getTrades, calculateMetrics } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";
import PnLChart from "@/components/charts/PnLChart";
import WinLossChart from "@/components/charts/WinLossChart";
import HourlyChart from "@/components/charts/HourlyChart";
import DailyChart from "@/components/charts/DailyChart";
import RRChart from "@/components/charts/RRChart";

interface TimeBucketStat {
  key: string;
  trades: number;
  avgPnL: number;
}

interface StreakStats {
  bestWinStreak: number;
  worstLossStreak: number;
  currentWinStreak: number;
  currentLossStreak: number;
}

interface RiskSummary {
  avgRiskPercent: number;
  avgPositionPercent: number;
  avgMaxDrawdown: number;
  worstMaxDrawdown: number;
}

interface PerformanceSummary {
  avgMFE: number;
  avgMAE: number;
  avgPeakProfit: number;
  avgTimeToPeak: number;
}

function summarizeByHour(trades: Trade[]): TimeBucketStat[] {
  const buckets: Record<number, { count: number; pnl: number }> = {};
  trades.forEach((t) => {
    const hour =
      typeof t.entryHour === "number"
        ? t.entryHour
        : new Date(t.entryTime).getHours();
    if (!buckets[hour]) buckets[hour] = { count: 0, pnl: 0 };
    buckets[hour].count += 1;
    buckets[hour].pnl += t.realizedPnL;
  });
  return Object.entries(buckets)
    .map(([hour, v]) => ({
      key: `${hour}:00`,
      trades: v.count,
      avgPnL: Number((v.pnl / v.count).toFixed(2)),
    }))
    .sort((a, b) => b.avgPnL - a.avgPnL);
}

function summarizeByDay(trades: Trade[]): TimeBucketStat[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<number, { count: number; pnl: number }> = {};
  trades.forEach((t) => {
    const day =
      typeof t.dayOfWeek === "number"
        ? t.dayOfWeek
        : new Date(t.entryTime).getDay();
    if (!buckets[day]) buckets[day] = { count: 0, pnl: 0 };
    buckets[day].count += 1;
    buckets[day].pnl += t.realizedPnL;
  });
  return Object.entries(buckets)
    .map(([day, v]) => ({
      key: names[Number(day)],
      trades: v.count,
      avgPnL: Number((v.pnl / v.count).toFixed(2)),
    }))
    .sort((a, b) => b.avgPnL - a.avgPnL);
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

function summarizeRisk(trades: Trade[]): RiskSummary {
  if (trades.length === 0) {
    return {
      avgRiskPercent: 0,
      avgPositionPercent: 0,
      avgMaxDrawdown: 0,
      worstMaxDrawdown: 0,
    };
  }

  const withRisk = trades.filter(
    (t) =>
      typeof t.riskPercent === "number" &&
      typeof t.positionSizePercent === "number"
  );

  if (withRisk.length === 0) {
    return {
      avgRiskPercent: 0,
      avgPositionPercent: 0,
      avgMaxDrawdown: 0,
      worstMaxDrawdown: 0,
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
  const totalMaxDD = withRisk.reduce(
    (sum, t) => sum + (t.maxDrawdown ?? 0),
    0
  );
  const worstMaxDD = withRisk.reduce(
    (max, t) =>
      Math.max(max, typeof t.maxDrawdown === "number" ? t.maxDrawdown : 0),
    0
  );

  const n = withRisk.length;

  return {
    avgRiskPercent: Number((totalRisk / n).toFixed(2)),
    avgPositionPercent: Number((totalPos / n).toFixed(2)),
    avgMaxDrawdown: Number((totalMaxDD / n).toFixed(2)),
    worstMaxDrawdown: Number(worstMaxDD.toFixed(2)),
  };
}

function summarizePerformance(trades: Trade[]): PerformanceSummary {
  if (trades.length === 0) {
    return { avgMFE: 0, avgMAE: 0, avgPeakProfit: 0, avgTimeToPeak: 0 };
  }

  const withPerf = trades.filter(
    (t) =>
      typeof t.maxFavorableExcursion === "number" ||
      typeof t.maxAdverseExcursion === "number" ||
      typeof t.peakProfit === "number" ||
      typeof t.timeToPeakMinutes === "number"
  );

  if (withPerf.length === 0) {
    return { avgMFE: 0, avgMAE: 0, avgPeakProfit: 0, avgTimeToPeak: 0 };
  }

  const totalMFE = withPerf.reduce(
    (sum, t) => sum + (t.maxFavorableExcursion ?? 0),
    0
  );
  const totalMAE = withPerf.reduce(
    (sum, t) => sum + Math.abs(t.maxAdverseExcursion ?? 0),
    0
  );
  const totalPeak = withPerf.reduce(
    (sum, t) => sum + (t.peakProfit ?? 0),
    0
  );
  const totalTimeToPeak = withPerf.reduce(
    (sum, t) => sum + (t.timeToPeakMinutes ?? 0),
    0
  );

  const n = withPerf.length;

  return {
    avgMFE: Number((totalMFE / n).toFixed(2)),
    avgMAE: Number((totalMAE / n).toFixed(2)),
    avgPeakProfit: Number((totalPeak / n).toFixed(2)),
    avgTimeToPeak: Number((totalTimeToPeak / n).toFixed(1)),
  };
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await getTrades(filters);
      setTrades(fetched);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const metrics = useMemo(() => calculateMetrics(trades), [trades]);
  const byHour = useMemo(() => summarizeByHour(trades), [trades]);
  const byDay = useMemo(() => summarizeByDay(trades), [trades]);
  const streaks = useMemo(() => summarizeStreaks(trades), [trades]);
  const risk = useMemo(() => summarizeRisk(trades), [trades]);
  const perf = useMemo(() => summarizePerformance(trades), [trades]);

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-6 py-6 max-w-7xl">

        <TradeFilters filters={filters} onFilterChange={setFilters} />

        <Dashboard metrics={metrics} />

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
          <>
            {/* Charts Section - Main Visualizations */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-100 to-cyan-200 bg-clip-text text-transparent">
                  Visual Analytics
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* P&L Over Time Chart */}
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-100">
                      P&L Over Time
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Track profit and loss progression
                  </p>
                  <PnLChart trades={trades} />
                </div>

                {/* Win/Loss Distribution */}
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-100">
                      Win/Loss Breakdown
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Distribution of winning vs losing trades
                  </p>
                  <WinLossChart trades={trades} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Hourly Performance */}
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-100">
                      Performance by Hour
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Most profitable trading hours
                  </p>
                  <HourlyChart trades={trades} />
                </div>

                {/* Daily Performance */}
                <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-1 h-5 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-100">
                      Performance by Day
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    Best trading days of the week
                  </p>
                  <DailyChart trades={trades} />
                </div>
              </div>

              {/* R:R Distribution Chart */}
              <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-5 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-100">
                    Risk:Reward Distribution
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Distribution of realized R:R ratios
                </p>
                <RRChart trades={trades} />
              </div>
            </div>

            {/* Summary Cards Section */}
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
                      Avg Max Drawdown
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      ₹{risk.avgMaxDrawdown}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Worst Drawdown
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      ₹{risk.worstMaxDrawdown}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Tracking */}
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">Trade Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-green-500/20 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Avg MFE (₹)
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ₹{perf.avgMFE}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-red-500/20 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Avg MAE (₹)
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      ₹{perf.avgMAE}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-green-500/20 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Avg Peak Profit
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ₹{perf.avgPeakProfit}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl shadow-lg p-5 border border-gray-700/50 backdrop-blur-sm">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                      Avg Time to Peak
                    </div>
                    <div className="text-2xl font-bold text-cyan-400">
                      {perf.avgTimeToPeak}m
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!isLoading && trades.length === 0 && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No trades found. Start logging trades to see analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
}


