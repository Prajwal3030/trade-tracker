"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import Dashboard from "@/components/Dashboard";
import TradeFilters from "@/components/TradeFilters";
import { getTrades, calculateMetrics } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">
            Analytics & Insights
          </h1>
          <p className="text-gray-600">
            Discover your best hours, best days, and how your behavior impacts
            results.
          </p>
        </header>

        <NavBar />

        <TradeFilters filters={filters} onFilterChange={setFilters} />

        <Dashboard metrics={metrics} />

        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Current Streak
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {streaks.currentWinStreak > 0 && (
                  <span className="text-emerald-600">
                    {streaks.currentWinStreak} win
                    {streaks.currentWinStreak > 1 ? "s" : ""} in a row
                  </span>
                )}
                {streaks.currentLossStreak > 0 && (
                  <span className="text-rose-600">
                    {streaks.currentLossStreak} loss
                    {streaks.currentLossStreak > 1 ? "es" : ""} in a row
                  </span>
                )}
                {streaks.currentWinStreak === 0 &&
                  streaks.currentLossStreak === 0 && (
                    <span className="text-slate-500">No active streak</span>
                  )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Best Win Streak
              </div>
              <div className="text-lg font-semibold text-emerald-600">
                {streaks.bestWinStreak} trade
                {streaks.bestWinStreak === 1 ? "" : "s"}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Worst Loss Streak
              </div>
              <div className="text-lg font-semibold text-rose-600">
                {streaks.worstLossStreak} trade
                {streaks.worstLossStreak === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        )}

        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Risk % per Trade
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {risk.avgRiskPercent}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Position Size % of Account
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {risk.avgPositionPercent}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Max Drawdown (₹)
              </div>
              <div className="text-lg font-semibold text-rose-600">
                ₹{risk.avgMaxDrawdown}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Worst Max Drawdown (₹)
              </div>
              <div className="text-lg font-semibold text-rose-700">
                ₹{risk.worstMaxDrawdown}
              </div>
            </div>
          </div>
        )}

        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Max Favorable Excursion (₹)
              </div>
              <div className="text-lg font-semibold text-emerald-600">
                ₹{perf.avgMFE}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Max Adverse Excursion (₹)
              </div>
              <div className="text-lg font-semibold text-rose-600">
                ₹{perf.avgMAE}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Peak Profit (₹)
              </div>
              <div className="text-lg font-semibold text-slate-900">
                ₹{perf.avgPeakProfit}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="text-xs font-medium text-slate-500 mb-1">
                Avg Time to Peak (minutes)
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {perf.avgTimeToPeak}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Loading trades...
          </div>
        )}

        {!isLoading && trades.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Best & Worst Hours
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Based on average realized P&amp;L for each entry hour.
              </p>
              <div className="space-y-2">
                {byHour.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {bucket.key} ({bucket.trades} trades)
                    </span>
                    <span
                      className={
                        bucket.avgPnL >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      ₹{bucket.avgPnL}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Best & Worst Days of Week
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Based on average realized P&amp;L for each trading day.
              </p>
              <div className="space-y-2">
                {byDay.map((bucket) => (
                  <div
                    key={bucket.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {bucket.key} ({bucket.trades} trades)
                    </span>
                    <span
                      className={
                        bucket.avgPnL >= 0
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      ₹{bucket.avgPnL}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


