"use client";

import { useEffect, useState, useCallback } from "react";
import TradeFilters from "@/components/TradeFilters";
import TradeTable from "@/components/TradeTable";
import TradeForm from "@/components/TradeForm";
import { getTrades } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

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

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <TradeFilters filters={filters} onFilterChange={setFilters} />

        {isLoading ? (
          <div className="bg-[#1f2937] rounded-lg shadow-md p-6 text-center text-gray-400 border border-gray-700">
            Loading trades...
          </div>
        ) : (
          <TradeTable trades={trades} onEdit={(trade) => setEditingTrade(trade)} />
        )}

        {editingTrade && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
            onClick={() => setEditingTrade(null)}
          >
            <div
              className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1f2937] rounded-lg shadow-xl border border-gray-700">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-100">
                    Edit Trade – {editingTrade.asset} ({editingTrade.strategyId})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingTrade(null)}
                    className="text-sm text-gray-400 hover:text-gray-200"
                  >
                    Close
                  </button>
                </div>
                <div className="p-6">
                  <TradeForm
                    mode="edit"
                    tradeToEdit={editingTrade}
                    onTradeSaved={() => {
                      setEditingTrade(null);
                      loadTrades();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


