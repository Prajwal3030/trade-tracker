"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getFundAccounts,
  createFundAccount,
  updateFundAccount,
  deleteFundAccount,
  updateFundAccountBalance,
} from "@/lib/fundAccounts";
import { getTrades, updateTrade } from "@/lib/trades";
import { FundAccount } from "@/types/trade";

export default function FundAccountsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", initialBalance: "" });
  const [error, setError] = useState<string | null>(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      loadFundAccounts();
    }
  }, [loading, user, router]);

  const loadFundAccounts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const accounts = await getFundAccounts(user.uid);
      setFundAccounts(accounts);
    } catch (error) {
      console.error("Error loading fund accounts:", error);
      setError("Failed to load fund accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!formData.name.trim()) {
      setError("Account name is required");
      return;
    }
    const balance = parseFloat(formData.initialBalance) || 0;
    if (balance < 0) {
      setError("Initial balance cannot be negative");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      await createFundAccount({
        userId: user.uid,
        name: formData.name.trim(),
        initialBalance: balance,
        balance: balance,
      });
      setFormData({ name: "", initialBalance: "" });
      await loadFundAccounts();
    } catch (error: any) {
      console.error("Error creating fund account:", error);
      // Show more specific error message
      const errorMessage = error?.message || "Failed to create fund account";
      if (errorMessage.includes("permission") || errorMessage.includes("Permission")) {
        setError("Permission denied. Please check Firestore rules are deployed.");
      } else if (errorMessage.includes("network") || errorMessage.includes("Network")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(`Failed to create fund account: ${errorMessage}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string, name: string) => {
    setError(null);
    try {
      await updateFundAccount(id, { name });
      setEditingId(null);
      await loadFundAccounts();
    } catch (error) {
      console.error("Error updating fund account:", error);
      setError("Failed to update fund account");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this fund account? This action cannot be undone.")) {
      return;
    }
    setError(null);
    try {
      await deleteFundAccount(id);
      await loadFundAccounts();
    } catch (error) {
      console.error("Error deleting fund account:", error);
      setError("Failed to delete fund account");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAutoAssignAllTrades = async () => {
    if (!user || fundAccounts.length === 0) {
      setError("No fund accounts available");
      return;
    }

    // Find "account 1" or use first account
    const account1 = fundAccounts.find(acc => 
      acc.name.toLowerCase().includes("account 1") || 
      acc.name.toLowerCase().includes("account1")
    ) || fundAccounts[0];

    if (!account1?.id) {
      setError("No fund account found");
      return;
    }

    if (!window.confirm(
      `This will assign all existing trades to "${account1.name}" and update the account balance. Continue?`
    )) {
      return;
    }

    setIsAutoAssigning(true);
    setError(null);

    try {
      // Get all trades
      const allTrades = await getTrades({}, user.uid);
      
      // Filter trades that don't have a fundAccountId
      const tradesToMigrate = allTrades.filter(trade => !trade.fundAccountId);
      
      if (tradesToMigrate.length === 0) {
        setError("All trades already have a fund account assigned");
        setIsAutoAssigning(false);
        return;
      }

      let totalPnL = 0;

      // Update each trade with the fund account ID
      for (const trade of tradesToMigrate) {
        try {
          await updateTrade(trade.id!, {
            ...trade,
            fundAccountId: account1.id,
          });
          totalPnL += trade.realizedPnL;
        } catch (err) {
          console.error(`Error updating trade ${trade.id}:`, err);
        }
      }

      // Update the fund account balance with the total P&L from all migrated trades
      // Always update even if totalPnL is 0 to ensure consistency
      await updateFundAccountBalance(account1.id, totalPnL);

      // Reload accounts to show updated balance
      await loadFundAccounts();
      
      const pnlText = totalPnL >= 0 
        ? `+${formatCurrency(totalPnL)}` 
        : formatCurrency(totalPnL);
      
      alert(
        `Successfully assigned ${tradesToMigrate.length} trades to "${account1.name}".\n\n` +
        `Total P&L: ${pnlText}\n` +
        `Account balance has been updated.`
      );
    } catch (error: any) {
      console.error("Error auto-assigning trades:", error);
      setError(`Failed to assign trades: ${error?.message || "Unknown error"}`);
    } finally {
      setIsAutoAssigning(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827]">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-100 to-amber-200 bg-clip-text text-transparent">
                  Fund Accounts
                </h1>
              </div>
              <p className="text-gray-400 text-sm md:text-base">
                Manage multiple trading accounts and track balances automatically
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAutoAssignAllTrades}
                disabled={isAutoAssigning || fundAccounts.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAutoAssigning ? "Assigning..." : "Auto-Assign All Trades"}
              </button>
              <a
                href="/fund-accounts/migrate"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all text-sm"
              >
                Manual Assign
              </a>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Create New Account Form */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm mb-8">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Create New Fund Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Main Account, Swing Trading, Day Trading"
                className="w-full px-4 py-3 bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Initial Balance (₹) *
              </label>
              <input
                type="number"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all"
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : "Create Account"}
          </button>
        </div>

        {/* Fund Accounts List */}
        {isLoading ? (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4 animate-pulse">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">Loading fund accounts...</p>
          </div>
        ) : fundAccounts.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl p-12 text-center border border-gray-700/50 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg">No fund accounts found. Create your first account above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fundAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm hover:border-amber-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  {editingId === account.id ? (
                    <input
                      type="text"
                      defaultValue={account.name}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== account.name) {
                          handleUpdate(account.id!, e.target.value.trim());
                        } else {
                          setEditingId(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        } else if (e.key === "Escape") {
                          setEditingId(null);
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 bg-[#020617] border border-amber-500/50 rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  ) : (
                    <h3
                      className="text-lg font-bold text-gray-100 cursor-pointer hover:text-amber-400 transition-colors"
                      onClick={() => setEditingId(account.id!)}
                      title="Click to edit"
                    >
                      {account.name}
                    </h3>
                  )}
                  <button
                    onClick={() => handleDelete(account.id!)}
                    className="text-red-400 hover:text-red-300 transition-colors p-1"
                    title="Delete account"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Current Balance</div>
                    <div className={`text-2xl font-bold ${
                      account.balance >= account.initialBalance
                        ? "text-green-400"
                        : account.balance > 0
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}>
                      {formatCurrency(account.balance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Initial Balance</div>
                    <div className="text-lg font-semibold text-gray-300">
                      {formatCurrency(account.initialBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Total P&L</div>
                    <div className={`text-lg font-semibold ${
                      account.balance >= account.initialBalance
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {account.balance >= account.initialBalance ? "+" : ""}
                      {formatCurrency(account.balance - account.initialBalance)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Return %</div>
                    <div className={`text-lg font-semibold ${
                      account.balance >= account.initialBalance
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {account.initialBalance > 0
                        ? (((account.balance - account.initialBalance) / account.initialBalance) * 100).toFixed(2)
                        : "0.00"}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

