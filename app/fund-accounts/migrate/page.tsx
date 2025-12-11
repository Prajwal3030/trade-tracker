"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getFundAccounts } from "@/lib/fundAccounts";
import { getTrades, updateTrade } from "@/lib/trades";
import { FundAccount, Trade } from "@/types/trade";
import { updateFundAccountBalance } from "@/lib/fundAccounts";

export default function MigrateTradesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    total: number;
    processed: number;
    errors: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      loadFundAccounts();
      // Auto-select first account or one named "account 1"
      const autoSelectAccount = async () => {
        const accounts = await getFundAccounts(user.uid);
        setFundAccounts(accounts);
        if (accounts.length > 0) {
          // Try to find "account 1" or use first account
          const account1 = accounts.find(acc => 
            acc.name.toLowerCase().includes("account 1") || 
            acc.name.toLowerCase().includes("account1")
          );
          setSelectedAccountId(account1?.id || accounts[0].id!);
        }
      };
      autoSelectAccount();
    }
  }, [loading, user, router]);

  const loadFundAccounts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const accounts = await getFundAccounts(user.uid);
      setFundAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id!);
      }
    } catch (error) {
      console.error("Error loading fund accounts:", error);
      setError("Failed to load fund accounts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!user || !selectedAccountId) {
      setError("Please select a fund account");
      return;
    }

    setIsMigrating(true);
    setError(null);
    setSuccess(false);
    setMigrationStatus({ total: 0, processed: 0, errors: 0 });

    try {
      // Get all trades for the user
      const allTrades = await getTrades({}, user.uid);
      
      // Filter trades that don't have a fundAccountId
      const tradesToMigrate = allTrades.filter(trade => !trade.fundAccountId);
      
      if (tradesToMigrate.length === 0) {
        setSuccess(true);
        setMigrationStatus({ total: 0, processed: 0, errors: 0 });
        setIsMigrating(false);
        return;
      }

      setMigrationStatus({ 
        total: tradesToMigrate.length, 
        processed: 0, 
        errors: 0 
      });

      let totalPnL = 0;
      let processed = 0;
      let errors = 0;

      // Update each trade with the fund account ID
      for (const trade of tradesToMigrate) {
        try {
          await updateTrade(trade.id!, {
            ...trade,
            fundAccountId: selectedAccountId,
          });
          totalPnL += trade.realizedPnL;
          processed++;
          setMigrationStatus({ 
            total: tradesToMigrate.length, 
            processed, 
            errors 
          });
        } catch (err) {
          console.error(`Error updating trade ${trade.id}:`, err);
          errors++;
          setMigrationStatus({ 
            total: tradesToMigrate.length, 
            processed, 
            errors 
          });
        }
      }

      // Update the fund account balance with the total P&L from all migrated trades
      if (totalPnL !== 0) {
        await updateFundAccountBalance(selectedAccountId, totalPnL);
      }

      setSuccess(true);
    } catch (error: any) {
      console.error("Error migrating trades:", error);
      setError(`Migration failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
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
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-amber-400 hover:text-amber-300 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Fund Accounts
          </button>
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-1 h-6 md:h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full" />
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-100 to-amber-200 bg-clip-text text-transparent">
              Assign Fund Account to Existing Trades
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Assign a fund account to all existing trades that don't have one assigned yet
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            Migration completed successfully! {migrationStatus?.processed} trades have been assigned to the fund account.
          </div>
        )}

        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm mb-8">
          <h2 className="text-lg font-bold text-gray-100 mb-4">Select Fund Account</h2>
          {isLoading ? (
            <div className="text-gray-400">Loading fund accounts...</div>
          ) : fundAccounts.length === 0 ? (
            <div className="text-red-400">
              No fund accounts found. Please create a fund account first.
            </div>
          ) : (
            <>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={isMigrating}
                className="w-full px-4 py-3 bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all disabled:opacity-50"
              >
                {fundAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-400">
                All existing trades without a fund account will be assigned to this account, and the account balance will be updated based on their P&L.
              </p>
            </>
          )}
        </div>

        {migrationStatus && (
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm mb-8">
            <h2 className="text-lg font-bold text-gray-100 mb-4">Migration Progress</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total trades to migrate:</span>
                <span className="text-gray-200 font-semibold">{migrationStatus.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Processed:</span>
                <span className="text-green-400 font-semibold">{migrationStatus.processed}</span>
              </div>
              {migrationStatus.errors > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Errors:</span>
                  <span className="text-red-400 font-semibold">{migrationStatus.errors}</span>
                </div>
              )}
              {migrationStatus.total > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(migrationStatus.processed / migrationStatus.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleMigrate}
            disabled={isMigrating || !selectedAccountId || fundAccounts.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? "Migrating..." : "Assign Fund Account to All Existing Trades"}
          </button>
          
          {selectedAccountId && fundAccounts.length > 0 && (
            <div className="text-sm text-gray-400 text-center">
              This will assign all trades without a fund account to "{fundAccounts.find(a => a.id === selectedAccountId)?.name}" and update the account balance based on their P&L.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

