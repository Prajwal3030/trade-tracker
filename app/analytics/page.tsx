"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";
import TradeFilters from "@/components/TradeFilters";
import { getTrades, calculateMetrics } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";
import { useAuth } from "@/components/AuthProvider";


export default function AnalyticsPage() {
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

  const metrics = useMemo(() => calculateMetrics(trades), [trades]);

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <TradeFilters filters={filters} onFilterChange={setFilters} />

        <Dashboard metrics={metrics} />

        {/* Category Navigation */}
        {!isLoading && trades.length > 0 && (
          <div className="mt-8 md:mt-12">
            <div className="flex items-center gap-2 md:gap-3 mb-6">
              <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-100 to-amber-200 bg-clip-text text-transparent">
                Analytics Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visual Analytics Card */}
              <Link
                href="/analytics/visual"
                className="group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-8 border border-gray-700/50 hover:border-cyan-500/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-100 mb-1 group-hover:text-cyan-300 transition-colors">
                      Visual Analytics
                    </h3>
                    <p className="text-sm text-gray-400">
                      Charts and visualizations
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Explore P&L trends, win/loss distributions, hourly and daily performance patterns, and risk-reward ratios through interactive charts.
                </p>
              </Link>

              {/* Performance Analytics Card */}
              <Link
                href="/analytics/performance"
                className="group bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-8 border border-gray-700/50 hover:border-purple-500/50 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-100 mb-1 group-hover:text-purple-300 transition-colors">
                      Performance Summary
                    </h3>
                    <p className="text-sm text-gray-400">
                      Metrics and statistics
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Analyze trading streaks, risk management metrics, drawdowns, and trade performance indicators including MFE, MAE, and peak profits.
                </p>
              </Link>
            </div>
          </div>
        )}

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


