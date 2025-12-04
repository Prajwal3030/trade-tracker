"use client";

import { Trade } from "@/types/trade";

interface TradeTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
}

export default function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
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
        <div className="flex justify-center mb-4">
          <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-lg">No trades found. Start logging your trades to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2937] rounded-xl md:rounded-2xl shadow-2xl overflow-hidden border border-gray-700/80">
      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle px-4 md:px-0">
          <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#020617]">
            <tr>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Asset
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Strategy
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Direction
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Entry Price
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Exit Price
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Size
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                P&L
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                R:R
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Exit Reason
              </th>
              <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Adherent
              </th>
              {(onEdit || onDelete) && (
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
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
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-200">
                  {formatDate(trade.entryTime)}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-medium text-gray-100">
                  {trade.asset}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-400">
                  {trade.strategyId}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                  <span
                    className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${
                      trade.direction === "Long"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.direction}
                  </span>
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-200">
                  ₹{trade.optionEntryPrice.toFixed(2)}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-200">
                  ₹{trade.optionExitPrice.toFixed(2)}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-200">
                  {trade.positionSize}
                </td>
                <td
                  className={`px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm font-semibold ${
                    trade.realizedPnL >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(trade.realizedPnL)}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-200">
                  {trade.realizedRR.toFixed(2)}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm text-gray-400">
                  {trade.exitReason}
                </td>
                <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                  <span
                    className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs font-semibold rounded-full ${
                      trade.isAdherent
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.isAdherent ? "Yes" : "No"}
                  </span>
                </td>
                {(onEdit || onDelete) && (
                  <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap text-xs md:text-sm">
                    <div className="flex items-center gap-1 md:gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(trade)}
                          className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium bg-amber-400 text-gray-900 hover:bg-amber-500 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(trade)}
                          className="inline-flex items-center px-2 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

