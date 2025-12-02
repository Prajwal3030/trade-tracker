"use client";

import { Trade } from "@/types/trade";

interface TradeTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
}

export default function TradeTable({ trades, onEdit }: TradeTableProps) {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (trades.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-gray-400 text-lg">No trades found. Start logging your trades to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2937] rounded-2xl shadow-2xl overflow-hidden border border-gray-700/80">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#020617]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Strategy
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Direction
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Entry Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Exit Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                P&L
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                R:R
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Exit Reason
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Adherent
              </th>
              {onEdit && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-[#1f2937] divide-y divide-gray-700">
            {trades.map((trade) => (
              <tr
                key={trade.id}
                className="hover:bg-[#111827] transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                  {formatDate(trade.entryTime)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                  {trade.asset}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                  {trade.strategyId}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.direction === "Long"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.direction}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                  ₹{trade.optionEntryPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                  ₹{trade.optionExitPrice.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                  {trade.positionSize}
                </td>
                <td
                  className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${
                    trade.realizedPnL >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(trade.realizedPnL)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">
                  {trade.realizedRR.toFixed(2)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                  {trade.exitReason}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      trade.isAdherent
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.isAdherent ? "Yes" : "No"}
                  </span>
                </td>
                {onEdit && (
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <button
                      type="button"
                      onClick={() => onEdit(trade)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-400 text-gray-900 hover:bg-amber-500 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

