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
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Performance Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">
            Total Trades
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {metrics.totalTrades}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            metrics.overallPnL >= 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div
            className={`text-sm font-medium mb-1 ${
              metrics.overallPnL >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            Overall P&L
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.overallPnL >= 0 ? "text-green-900" : "text-red-900"
            }`}
          >
            {formatCurrency(metrics.overallPnL)}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm font-medium text-purple-700 mb-1">
            Win Rate
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {metrics.winRate}%
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-sm font-medium text-orange-700 mb-1">
            Average R:R
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {metrics.averageRR}
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            metrics.expectancy >= 0
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div
            className={`text-sm font-medium mb-1 ${
              metrics.expectancy >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            Expectancy
          </div>
          <div
            className={`text-2xl font-bold ${
              metrics.expectancy >= 0 ? "text-green-900" : "text-red-900"
            }`}
          >
            {metrics.expectancy}
          </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <div className="text-sm font-medium text-indigo-700 mb-1">
            Adherence Rate
          </div>
          <div className="text-2xl font-bold text-indigo-900">
            {metrics.adherenceRate}%
          </div>
        </div>
      </div>
    </div>
  );
}

