"use client";

import { useEffect, useState, useCallback } from "react";
import NavBar from "@/components/NavBar";
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">
            Trade Journal
          </h1>
          <p className="text-gray-600">
            Browse, filter, and review all your historical trades.
          </p>
        </header>

        <NavBar />

        <TradeFilters filters={filters} onFilterChange={setFilters} />

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            Loading trades...
          </div>
        ) : (
          <TradeTable trades={trades} onEdit={(trade) => setEditingTrade(trade)} />
        )}

        {editingTrade && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
            onClick={() => setEditingTrade(null)}
          >
            <div
              className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-lg shadow-xl">
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Trade – {editingTrade.asset} ({editingTrade.strategyId})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingTrade(null)}
                    className="text-sm text-gray-500 hover:text-gray-800"
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


