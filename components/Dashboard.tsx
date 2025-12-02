"use client";

import { TradeMetrics } from "@/types/trade";

interface DashboardProps {
  metrics: TradeMetrics;
}

export default function Dashboard({ metrics }: DashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 mb-4 border border-gray-700/50 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-100">
          Performance Metrics
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="group bg-[#111827] p-4 rounded-lg border border-gray-700/50 hover:border-amber-400/30 transition-all duration-300">
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Total Trades
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.totalTrades}
          </div>
        </div>

        <div className={`group bg-[#111827] p-4 rounded-lg border transition-all duration-300 ${
          metrics.overallPnL >= 0 
            ? "border-green-500/30 hover:border-green-500/50" 
            : "border-red-500/30 hover:border-red-500/50"
        }`}>
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Overall P&L
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.overallPnL >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(metrics.overallPnL)}
          </div>
        </div>

        <div className="group bg-[#111827] p-4 rounded-lg border border-gray-700/50 hover:border-amber-400/30 transition-all duration-300">
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Win Rate
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.winRate}%
          </div>
        </div>

        <div className="group bg-[#111827] p-4 rounded-lg border border-gray-700/50 hover:border-amber-400/30 transition-all duration-300">
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Average R:R
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.averageRR}
          </div>
        </div>

        <div className={`group bg-[#111827] p-4 rounded-lg border transition-all duration-300 ${
          metrics.expectancy >= 0 
            ? "border-green-500/30 hover:border-green-500/50" 
            : "border-red-500/30 hover:border-red-500/50"
        }`}>
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Expectancy
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.expectancy >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {metrics.expectancy}
          </div>
        </div>

        <div className="group bg-[#111827] p-4 rounded-lg border border-gray-700/50 hover:border-amber-400/30 transition-all duration-300">
          <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Adherence Rate
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.adherenceRate}%
          </div>
        </div>
      </div>
    </div>
  );
}

