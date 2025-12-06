"use client";

import { Trade } from "@/types/trade";

interface TradeTableProps {
  trades: Trade[];
  onEdit?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
}

export default function TradeTable({ trades, onEdit, onDelete }: TradeTableProps) {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString("en-IN", { month: "short" });
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${day} ${month}, ${displayHours}:${displayMinutes} ${ampm}`;
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
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl md:rounded-2xl shadow-xl p-6 md:p-12 text-center border border-gray-700/50 backdrop-blur-sm">
        <div className="flex justify-center mb-4">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm md:text-lg px-2">No trades found. Start logging your trades to see them here.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2937] rounded-xl md:rounded-2xl shadow-2xl overflow-hidden border border-gray-700/80 w-full">
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-700">
        {trades.map((trade) => (
          <div key={trade.id} className="p-4 hover:bg-[#111827] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-gray-100 truncate">
                    {trade.asset}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${
                      trade.direction === "Long"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.direction}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(trade.entryTime)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <span className="text-gray-500">Strategy:</span>
                <span className="text-gray-300 ml-1">{trade.strategyId}</span>
              </div>
              <div>
                <span className="text-gray-500">Entry:</span>
                <span className="text-gray-300 ml-1">₹{trade.optionEntryPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Exit:</span>
                <span className="text-gray-300 ml-1">₹{trade.optionExitPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="text-gray-300 ml-1">{trade.positionSize}</span>
              </div>
              <div>
                <span className="text-gray-500">R:R:</span>
                <span className="text-gray-300 ml-1">{trade.realizedRR.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Adherent:</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full inline-block ${
                    trade.isAdherent
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {trade.isAdherent ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <div>
                <span className="text-xs text-gray-500">P&L: </span>
                <span
                  className={`text-sm font-semibold ${
                    trade.realizedPnL >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(trade.realizedPnL)}
                </span>
              </div>
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(trade)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-400 text-gray-900 hover:bg-amber-500 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(trade)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto w-full" style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="divide-y divide-gray-700" style={{ width: 'max-content' }}>
          <thead className="bg-[#020617] sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Date
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Asset
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Strategy
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Dir
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Entry
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Exit
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Size
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                P&L
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                R:R
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Exit Reason
              </th>
              <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
                Adh
              </th>
              {(onEdit || onDelete) && (
                <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap">
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
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-200">
                  {formatDate(trade.entryTime)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs font-medium text-gray-100">
                  {trade.asset}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 max-w-[100px] truncate" title={trade.strategyId}>
                  {trade.strategyId}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      trade.direction === "Long"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.direction}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-200">
                  ₹{trade.optionEntryPrice.toFixed(2)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-200">
                  ₹{trade.optionExitPrice.toFixed(2)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-200">
                  {trade.positionSize}
                </td>
                <td
                  className={`px-2 py-2 whitespace-nowrap text-xs font-semibold ${
                    trade.realizedPnL >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(trade.realizedPnL)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-200">
                  {trade.realizedRR.toFixed(2)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-400 max-w-[80px] truncate" title={trade.exitReason}>
                  {trade.exitReason}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                      trade.isAdherent
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {trade.isAdherent ? "Yes" : "No"}
                  </span>
                </td>
                {(onEdit || onDelete) && (
                  <td className="px-2 py-2 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(trade)}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-400 text-gray-900 hover:bg-amber-500 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(trade)}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
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
  );
}

