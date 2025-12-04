"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TradeFilters from "@/components/TradeFilters";
import TradeTable from "@/components/TradeTable";
import TradeForm from "@/components/TradeForm";
import { getTrades, deleteTrade } from "@/lib/trades";
import { Trade, TradeFilters as TradeFiltersType } from "@/types/trade";
import { useAuth } from "@/components/AuthProvider";

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filters, setFilters] = useState<TradeFiltersType>({});
  const [isLoading, setIsLoading] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
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

  const handleDelete = async (trade: Trade) => {
    if (!trade.id) {
      console.error("Trade ID is missing");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete this trade?\n\nAsset: ${trade.asset}\nStrategy: ${trade.strategyId}\nP&L: ₹${trade.realizedPnL.toFixed(2)}\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await deleteTrade(trade.id);
        await loadTrades();
      } catch (error) {
        console.error("Error deleting trade:", error);
        alert("Failed to delete trade. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <TradeFilters filters={filters} onFilterChange={setFilters} />

        {isLoading ? (
          <div className="bg-[#1f2937] rounded-lg shadow-md p-6 text-center text-gray-400 border border-gray-700">
            Loading trades...
          </div>
        ) : (
          <TradeTable
            trades={trades}
            onEdit={(trade) => setEditingTrade(trade)}
            onDelete={handleDelete}
          />
        )}

        {editingTrade && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setEditingTrade(null)}
          >
            <div
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#1f2937] rounded-lg shadow-xl border border-gray-700">
                <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-700">
                  <h2 className="text-base md:text-lg font-semibold text-gray-100 truncate pr-2">
                    Edit Trade – {editingTrade.asset} ({editingTrade.strategyId})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditingTrade(null)}
                    className="text-sm text-gray-400 hover:text-gray-200 flex-shrink-0"
                  >
                    Close
                  </button>
                </div>
                <div className="p-4 md:p-6">
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


