"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TradeFilters from "@/components/TradeFilters";
import { getTrades } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";
import PnLChart from "@/components/charts/PnLChart";
import WinLossChart from "@/components/charts/WinLossChart";
import HourlyChart from "@/components/charts/HourlyChart";
import DailyChart from "@/components/charts/DailyChart";
import RRChart from "@/components/charts/RRChart";
import { useAuth } from "@/components/AuthProvider";

export default function VisualAnalyticsPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const loadTrades = useCallback(async () => {
    if (!user) {
      setTrades([]);
      return;
    }

    setIsLoading(true);
    try {
      const fetched = await getTrades(filters, user.uid);
      setTrades(fetched);
    } catch (error) {
      console.error("Error loading trades:", error);
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
          <div className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-100 to-cyan-200 bg-clip-text text-transparent">
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
        )}

        {!isLoading && trades.length === 0 && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No trades found. Start logging trades to see visual analytics!</p>
          </div>
        )}
      </div>
    </div>
  );
}


