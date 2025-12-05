"use client";

import { useState, useEffect } from "react";
import { saveTrade, updateTrade } from "@/lib/trades";
import { getStrategies, getStrategyById } from "@/lib/strategies";
import { Trade, Checklist, Strategy, ChecklistItem } from "@/types/trade";
import { useAuth } from "@/components/AuthProvider";
import { MoneyIcon, ChecklistIcon, ChartIcon, GlobeIcon, BrainIcon, BookIcon, EditIcon, DocumentIcon } from "@/components/Icons";

interface TradeFormProps {
  onTradeSaved?: () => void;
  mode?: "create" | "edit";
  tradeToEdit?: Trade | null;
}

export default function TradeForm({
  onTradeSaved,
  mode = "create",
  tradeToEdit,
}: TradeFormProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState<Omit<Trade, "id">>({
    userId: "",
    asset: "",
    strategyId: "Setup 1",
    direction: "Long",
    entryTime: new Date().toISOString().slice(0, 16),
    exitTime: new Date().toISOString().slice(0, 16),
    optionEntryPrice: 0,
    optionExitPrice: 0,
    positionSize: 0,
    stopLossPrice: 0,
    initialRisk: 0,
    initialReward: 0,
    realizedPnL: 0,
    realizedRR: 0,
    expectedRR: 0,
    exitReason: "Manual",
    emotionalState: "Calm",
    isAdherent: false,
    checklist: {
      H1_TrendAligned: false,
      M15_TrendAligned: false,
      M05_StructureMet: false,
      Confirmations: "",
      ExitRuleFollowed: false,
    },
    // extended fields (optional analytics helpers)
    maxFavorableExcursion: 0,
    maxAdverseExcursion: 0,
    peakProfit: 0,
    timeToPeakMinutes: 0,
    volatility: "Medium",
    trendH1: "Sideways",
    trendM15: "Sideways",
    trendM5: "Sideways",
    volumeProfile: "Normal",
    confidenceLevel: 5,
    setupQuality: 5,
    tradeNumber: 1,
    winStreak: 0,
    lossStreak: 0,
    accountBalance: 0,
    lessonsLearned: "",
    wouldTradeAgain: true,
    mistakes: "",
    whatWorked: "",
    riskPercent: 0,
    positionSizePercent: 0,
    maxDrawdown: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [isLoadingStrategies, setIsLoadingStrategies] = useState(true);

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // When editing, hydrate form with existing trade
  useEffect(() => {
    if (mode === "edit" && tradeToEdit && !initialLoadComplete) {
      const { id: _ignored, ...rest } = tradeToEdit;
      setFormData({
        ...rest,
        entryTime:
          rest.entryTime instanceof Date
            ? rest.entryTime.toISOString().slice(0, 16)
            : rest.entryTime,
        exitTime:
          rest.exitTime instanceof Date
            ? rest.exitTime.toISOString().slice(0, 16)
            : rest.exitTime,
      } as Omit<Trade, "id">);
      setInitialLoadComplete(true);
    }
  }, [mode, tradeToEdit, initialLoadComplete]);

  // Calculate realizedPnL and realizedRR whenever relevant fields change
  useEffect(() => {
    const pnl =
      (formData.optionExitPrice - formData.optionEntryPrice) *
      formData.positionSize;

    const riskPerUnit = Math.abs(
      (formData.stopLossPrice ?? 0) - formData.optionEntryPrice
    );
    const initialRisk = riskPerUnit * formData.positionSize;
    const rr = initialRisk > 0 ? pnl / initialRisk : 0;

    const rewardPerUnit = (formData.initialReward ?? 0) - formData.optionEntryPrice;
    const expectedRR =
      riskPerUnit > 0 ? Math.abs(rewardPerUnit) / riskPerUnit : 0;

    // Peak profit should only be calculated if MFE is greater than entry price
    // Otherwise, it should be 0 (no peak profit) or use manual entry
    const maxFavorableExcursion = formData.maxFavorableExcursion ?? 0;
    const peakPerUnit = maxFavorableExcursion > formData.optionEntryPrice
      ? maxFavorableExcursion - formData.optionEntryPrice
      : 0;
    const peakProfit = peakPerUnit * formData.positionSize;

    setFormData((prev) => ({
      ...prev,
      realizedPnL: Number(pnl.toFixed(2)),
      realizedRR: Number(rr.toFixed(2)),
      initialRisk: Number(initialRisk.toFixed(2)),
      expectedRR: Number(expectedRR.toFixed(2)),
      peakProfit: Number(peakProfit.toFixed(2)),
    }));
  }, [
    formData.optionEntryPrice,
    formData.optionExitPrice,
    formData.positionSize,
    formData.stopLossPrice,
    formData.initialReward,
    formData.maxFavorableExcursion,
  ]);

  // Auto-calculate risk metrics (risk %, position %, max drawdown) from inputs
  useEffect(() => {
    const accountBalance = formData.accountBalance ?? 0;
    let riskPercent = 0;
    let positionSizePercent = 0;

    if (accountBalance > 0) {
      riskPercent = (formData.initialRisk / accountBalance) * 100;
      const exposure = formData.positionSize * formData.optionEntryPrice;
      positionSizePercent = (exposure / accountBalance) * 100;
    }

    const maxDrawdown = Math.abs(formData.maxAdverseExcursion ?? 0);

    setFormData((prev) => ({
      ...prev,
      riskPercent: Number(riskPercent.toFixed(2)),
      positionSizePercent: Number(positionSizePercent.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
    }));
  }, [
    formData.initialRisk,
    formData.positionSize,
    formData.optionEntryPrice,
    formData.accountBalance,
    formData.maxAdverseExcursion,
  ]);

  // Load strategies when user is available
  useEffect(() => {
    const loadStrategies = async () => {
      if (!user) return;
      try {
        setIsLoadingStrategies(true);
        const loadedStrategies = await getStrategies(user.uid);
        setStrategies(loadedStrategies);
        
        // If there are strategies, try to find the one matching formData.strategyId
        if (loadedStrategies.length > 0) {
          const matching = loadedStrategies.find(s => s.name === formData.strategyId);
          if (matching) {
            setSelectedStrategy(matching);
          } else if (formData.strategyId && mode === "edit") {
            // For editing, try to load the strategy by name from formData
            // This handles cases where strategy might not exist anymore
            const defaultStrategy = loadedStrategies[0];
            if (defaultStrategy) {
              setSelectedStrategy(defaultStrategy);
              setFormData(prev => ({ ...prev, strategyId: defaultStrategy.name }));
            }
          } else {
            // Set first strategy as default
            setSelectedStrategy(loadedStrategies[0]);
            setFormData(prev => ({ ...prev, strategyId: loadedStrategies[0].name }));
          }
        }
      } catch (error) {
        console.error("Error loading strategies:", error);
      } finally {
        setIsLoadingStrategies(false);
      }
    };
    loadStrategies();
  }, [user]);

  // Load strategy details when strategyId changes
  useEffect(() => {
    if (!formData.strategyId || !user || !strategies.length) return;
    
    const strategy = strategies.find(s => s.name === formData.strategyId);
    if (strategy) {
      const strategyChanged = !selectedStrategy || selectedStrategy.id !== strategy.id;
      setSelectedStrategy(strategy);
      
      // Only rebuild checklist when strategy actually changes, not on initial load in edit mode
      if (strategyChanged && (mode === "create" || initialLoadComplete)) {
        // Build checklist from strategy, preserving existing values where possible
        const existingChecklist = formData.checklist;
        const newChecklist: Checklist = {
          H1_TrendAligned: existingChecklist?.H1_TrendAligned || false,
          M15_TrendAligned: existingChecklist?.M15_TrendAligned || false,
          M05_StructureMet: existingChecklist?.M05_StructureMet || false,
          Confirmations: existingChecklist?.Confirmations || "",
          ExitRuleFollowed: existingChecklist?.ExitRuleFollowed || false,
        };
        
        // Add dynamic checklist items, preserving existing values if they exist
        strategy.checklistItems.forEach((item: ChecklistItem) => {
          if (!(item.id in newChecklist)) {
            if (item.type === "checkbox") {
              newChecklist[item.id] = existingChecklist?.[item.id] || false;
            } else {
              newChecklist[item.id] = existingChecklist?.[item.id] || "";
            }
          }
        });
        
        setFormData(prev => ({
          ...prev,
          checklist: newChecklist,
        }));
      }
    }
  }, [formData.strategyId, strategies, user, mode, selectedStrategy, initialLoadComplete]);

  // Calculate isAdherent based on checklist
  useEffect(() => {
    const checklist = formData.checklist;
    if (!selectedStrategy) {
      // Default adherence check for backward compatibility
      const isAdherent =
        checklist.H1_TrendAligned &&
        checklist.M15_TrendAligned &&
        checklist.M05_StructureMet &&
        checklist.Confirmations.trim() !== "" &&
        checklist.ExitRuleFollowed;

      setFormData((prev) => ({
        ...prev,
        isAdherent,
      }));
      return;
    }

    // Dynamic adherence check based on strategy
    let allRequiredChecked = true;
    selectedStrategy.checklistItems.forEach((item: ChecklistItem) => {
      if (item.required || (item.type === "checkbox" && item.required !== false)) {
        const value = checklist[item.id];
        if (item.type === "checkbox" && !value) {
          allRequiredChecked = false;
        } else if (item.type === "text" && (!value || (typeof value === "string" && !value.trim()))) {
          allRequiredChecked = false;
        }
      }
    });
    
    // Also check default confirmations field
    const confirmationsFilled = checklist.Confirmations.trim() !== "";
    
    setFormData((prev) => ({
      ...prev,
      isAdherent: allRequiredChecked && confirmationsFilled,
    }));
  }, [formData.checklist, selectedStrategy]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith("checklist.")) {
      const checklistField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          [checklistField]:
            type === "checkbox" ? checked : value,
        },
      }));
    } else {
      if (type === "number") {
        // Handle number inputs - convert empty string to 0, otherwise parse the number
        const numValue = value === "" ? 0 : (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
        setFormData((prev) => ({
          ...prev,
          [name]: numValue,
        }));
      } else if (type === "checkbox") {
        setFormData((prev) => ({
          ...prev,
          [name]: checked,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // If field is empty on blur, set to default based on field type
    if (value === "" || value === null || value === undefined) {
      let defaultValue = 0;
      if (name === "confidenceLevel" || name === "setupQuality") {
        defaultValue = 5;
      } else if (name === "tradeNumber") {
        defaultValue = 1;
      }
      setFormData((prev) => ({
        ...prev,
        [name]: defaultValue,
      }));
    } else if (!isNaN(parseFloat(value))) {
      // Ensure valid number on blur
      const numValue = parseFloat(value);
      // Enforce min/max constraints
      if (name === "confidenceLevel" || name === "setupQuality") {
        const constrained = Math.max(1, Math.min(10, numValue));
        setFormData((prev) => ({
          ...prev,
          [name]: constrained,
        }));
      } else if (name === "tradeNumber") {
        const constrained = Math.max(1, numValue);
        setFormData((prev) => ({
          ...prev,
          [name]: constrained,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: numValue,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (!user) {
        throw new Error("You must be logged in to save trades.");
      }

      if (mode === "edit" && tradeToEdit?.id) {
        await updateTrade(tradeToEdit.id, {
          ...formData,
          userId: user.uid,
          entryTime: new Date(formData.entryTime),
          exitTime: new Date(formData.exitTime),
        });
      } else {
        await saveTrade({
          ...formData,
          userId: user.uid,
          entryTime: new Date(formData.entryTime),
          exitTime: new Date(formData.exitTime),
        });
      }

      setSubmitMessage({
        type: "success",
        text: "Trade saved successfully!",
      });

      // Notify parent component
      if (onTradeSaved) {
        onTradeSaved();
      }

      // Reset form only in create mode
      if (mode === "create") {
        setFormData({
          userId: user.uid,
          asset: "",
          strategyId: "Setup 1",
          direction: "Long",
          entryTime: new Date().toISOString().slice(0, 16),
          exitTime: new Date().toISOString().slice(0, 16),
          optionEntryPrice: 0,
          optionExitPrice: 0,
          positionSize: 0,
          stopLossPrice: 0,
          initialRisk: 0,
          initialReward: 0,
          realizedPnL: 0,
          realizedRR: 0,
          expectedRR: 0,
          exitReason: "Manual",
          emotionalState: "Calm",
          isAdherent: false,
          checklist: {
            H1_TrendAligned: false,
            M15_TrendAligned: false,
            M05_StructureMet: false,
            Confirmations: "",
            ExitRuleFollowed: false,
          },
          maxFavorableExcursion: 0,
          maxAdverseExcursion: 0,
          peakProfit: 0,
          timeToPeakMinutes: 0,
          volatility: "Medium",
          trendH1: "Sideways",
          trendM15: "Sideways",
          trendM5: "Sideways",
          volumeProfile: "Normal",
          confidenceLevel: 5,
          setupQuality: 5,
          tradeNumber: 1,
          winStreak: 0,
          lossStreak: 0,
          accountBalance: 0,
          lessonsLearned: "",
          wouldTradeAgain: true,
          mistakes: "",
          whatWorked: "",
          riskPercent: 0,
          positionSizePercent: 0,
          maxDrawdown: 0,
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: "error",
        text: "Failed to save trade. Please try again.",
      });
      console.error("Error saving trade:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1f2937] rounded-lg shadow-lg p-4 md:p-6 border border-gray-700/50 overflow-hidden max-w-full">
      <div className="flex items-center gap-3 mb-5 md:mb-6 pb-4 border-b border-gray-700/50">
        {mode === "edit" ? <EditIcon className="w-6 h-6 text-amber-400" /> : <DocumentIcon className="w-6 h-6 text-amber-400" />}
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">
          {mode === "edit" ? "Edit Trade" : "Log New Trade"}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        {/* Basic Trade Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset/Instrument *
            </label>
            <input
              type="text"
              name="asset"
              value={formData.asset}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              placeholder="e.g., NIFTY, EURUSD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Strategy ID *
            </label>
            <div className="relative">
              <select
                name="strategyId"
                value={formData.strategyId}
                onChange={handleInputChange}
                required
                disabled={isLoadingStrategies}
                className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                style={{
                  fontSize: '16px', // Prevents zoom on iOS
                }}
              >
                {isLoadingStrategies ? (
                  <option value="">Loading strategies...</option>
                ) : strategies.length === 0 ? (
                  <option value="">No strategies found. Create one first.</option>
                ) : (
                  strategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.name} style={{ fontSize: '16px', padding: '8px' }}>
                      {strategy.name}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Direction *
            </label>
            <div className="relative">
              <select
                name="direction"
                value={formData.direction}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                style={{
                  fontSize: '16px', // Prevents zoom on iOS
                }}
              >
                <option value="Long" style={{ fontSize: '16px', padding: '8px' }}>Long (Buy)</option>
                <option value="Short" style={{ fontSize: '16px', padding: '8px' }}>Short (Sell)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="entryTime" className="block text-sm font-medium text-gray-300 mb-2 cursor-pointer">
              Entry Time *
            </label>
            <div className="relative cursor-pointer">
              <input
                id="entryTime"
                type="datetime-local"
                name="entryTime"
                value={
                  formData.entryTime instanceof Date
                    ? formData.entryTime.toISOString().slice(0, 16)
                    : formData.entryTime
                }
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-12 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 cursor-pointer hover:border-amber-400/50 transition-all"
                style={{
                  colorScheme: "dark",
                  WebkitAppearance: "none",
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="exitTime" className="block text-sm font-medium text-gray-300 mb-2 cursor-pointer">
              Exit Time *
            </label>
            <div className="relative cursor-pointer">
              <input
                id="exitTime"
                type="datetime-local"
                name="exitTime"
                value={
                  formData.exitTime instanceof Date
                    ? formData.exitTime.toISOString().slice(0, 16)
                    : formData.exitTime
                }
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-12 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 cursor-pointer hover:border-amber-400/50 transition-all"
                style={{
                  colorScheme: "dark",
                  WebkitAppearance: "none",
                }}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exit Reason *
            </label>
            <div className="relative">
              <select
                name="exitReason"
                value={formData.exitReason}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                style={{
                  fontSize: '16px', // Prevents zoom on iOS
                }}
              >
                <option value="SL Hit" style={{ fontSize: '16px', padding: '8px' }}>Stop Loss Hit</option>
                <option value="TP Hit" style={{ fontSize: '16px', padding: '8px' }}>Take Profit Hit</option>
                <option value="Manual" style={{ fontSize: '16px', padding: '8px' }}>Manual Exit</option>
                <option value="Time Limit" style={{ fontSize: '16px', padding: '8px' }}>Time Limit Reached</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Emotional State *
            </label>
            <div className="relative">
              <select
                name="emotionalState"
                value={formData.emotionalState}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all hover:border-slate-500 appearance-none cursor-pointer"
                style={{
                  fontSize: '16px', // Prevents zoom on iOS
                }}
              >
                <option value="Calm" style={{ fontSize: '16px', padding: '8px' }}>Calm & Composed</option>
                <option value="Greedy" style={{ fontSize: '16px', padding: '8px' }}>Greedy</option>
                <option value="Fearful" style={{ fontSize: '16px', padding: '8px' }}>Fearful</option>
                <option value="Rushed" style={{ fontSize: '16px', padding: '8px' }}>Rushed / Impulsive</option>
                <option value="Revenge" style={{ fontSize: '16px', padding: '8px' }}>Revenge Trading</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Position */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2">
            <MoneyIcon />
            Pricing & Position
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Option Entry Price (₹) *
              </label>
              <input
                type="number"
                name="optionEntryPrice"
                value={formData.optionEntryPrice === 0 ? "" : formData.optionEntryPrice}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Option Exit Price (₹) *
              </label>
              <input
                type="number"
                name="optionExitPrice"
                value={formData.optionExitPrice === 0 ? "" : formData.optionExitPrice}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Planned Stop Loss Price (₹)
              </label>
              <input
                type="number"
                name="stopLossPrice"
                value={formData.stopLossPrice === 0 ? "" : formData.stopLossPrice || ""}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used to auto-calc risk: |Entry - SL| × Position Size.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Position Size (Lots) *
              </label>
              <input
                type="number"
                name="positionSize"
                value={formData.positionSize === 0 ? "" : formData.positionSize}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                required
                step="1"
                min="0"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Target / Expected Price (₹) *
              </label>
              <input
                type="number"
                name="initialReward"
                value={formData.initialReward === 0 ? "" : formData.initialReward}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                required
                step="0.01"
                min="0"
                className="w-full px-4 py-3 text-base md:text-sm bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all hover:border-slate-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Option price you expect to exit at when the trade hits target.
              </p>
            </div>
          </div>

          {/* Calculated Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#020617] p-4 rounded-xl border border-slate-700 shadow-lg">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Realized P&L (₹)
              </label>
              <div className={`text-2xl font-bold ${
                formData.realizedPnL >= 0 ? "text-green-400" : "text-red-400"
              }`}>
                ₹{formData.realizedPnL.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#020617] p-4 rounded-xl border border-slate-700 shadow-lg">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Realized R:R
              </label>
              <div className="text-2xl font-bold text-amber-300">
                {formData.realizedRR.toFixed(2)}
              </div>
            </div>

            <div className="bg-[#020617] p-4 rounded-xl border border-slate-700 shadow-lg">
              <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Expected R:R
              </label>
              <div className="text-2xl font-bold text-amber-300">
                {formData.expectedRR?.toFixed(2) ?? "0.00"}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2 flex-wrap">
            <ChecklistIcon />
            <span>Trade Checklist</span>
            {selectedStrategy && (
              <span className="text-sm font-normal text-amber-400/70 ml-auto">
                ({selectedStrategy.name})
              </span>
            )}
          </h3>
          {!selectedStrategy && !isLoadingStrategies && (
            <div className="text-yellow-400 text-sm mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
              Please select a strategy first to see the checklist items.
            </div>
          )}
          {selectedStrategy && (
            <div className="space-y-3">
              {selectedStrategy.checklistItems.map((item: ChecklistItem) => (
                <div key={item.id}>
                  {item.type === "checkbox" ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name={`checklist.${item.id}`}
                        checked={!!formData.checklist[item.id]}
                        onChange={handleInputChange}
                        className="mr-2 w-4 h-4 text-amber-400 border-slate-600 rounded focus:ring-amber-400"
                      />
                      <span className="text-sm text-gray-300">
                        {item.label}
                        {item.required && <span className="text-red-400 ml-1">*</span>}
                      </span>
                    </label>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {item.label}
                        {item.required && <span className="text-red-400 ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        name={`checklist.${item.id}`}
                        value={formData.checklist[item.id] as string || ""}
                        onChange={handleInputChange}
                        required={item.required}
                        className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
                        placeholder={item.label}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Always show Confirmations field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmations (comma-separated) *
                </label>
                <input
                  type="text"
                  name="checklist.Confirmations"
                  value={formData.checklist.Confirmations}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
                  placeholder={selectedStrategy.confirmationsPlaceholder || "e.g., BoS, Liquidity Grab, OB Test, Reversal Candle, Trend Line Bounce"}
                />
              </div>
            </div>
          )}

          <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-300 ${
            formData.isAdherent 
              ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10" 
              : "bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10"
          }`}>
            <label className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                formData.isAdherent ? "bg-green-500" : "bg-red-500"
              }`}>
                {formData.isAdherent && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-semibold ${
                formData.isAdherent ? "text-green-400" : "text-red-400"
              }`}>
                Trade Adherent (Auto-calculated)
              </span>
            </label>
          </div>
        </div>

        {/* Performance Tracking */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2">
            <ChartIcon />
            Trade Performance Tracking
          </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Favorable Excursion (₹)
              </label>
              <input
                type="number"
                name="maxFavorableExcursion"
                value={formData.maxFavorableExcursion ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Adverse Excursion (₹)
              </label>
              <input
                type="number"
                name="maxAdverseExcursion"
                value={formData.maxAdverseExcursion ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Peak Profit (₹)
              </label>
              <input
                type="number"
                name="peakProfit"
                value={formData.peakProfit ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time to Peak (minutes)
              </label>
              <input
                type="number"
                name="timeToPeakMinutes"
                value={formData.timeToPeakMinutes ?? 0}
                onChange={handleInputChange}
                step="1"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Market Conditions */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2">
            <GlobeIcon />
            Market Conditions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volatility
              </label>
              <div className="relative">
                <select
                  name="volatility"
                  value={formData.volatility ?? "Medium"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Low" style={{ fontSize: '16px', padding: '8px' }}>Low Volatility</option>
                  <option value="Medium" style={{ fontSize: '16px', padding: '8px' }}>Medium Volatility</option>
                  <option value="High" style={{ fontSize: '16px', padding: '8px' }}>High Volatility</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1H Market Trend
              </label>
              <div className="relative">
                <select
                  name="trendH1"
                  value={formData.trendH1 ?? "Sideways"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Bullish" style={{ fontSize: '16px', padding: '8px' }}>Bullish (Uptrend)</option>
                  <option value="Bearish" style={{ fontSize: '16px', padding: '8px' }}>Bearish (Downtrend)</option>
                  <option value="Sideways" style={{ fontSize: '16px', padding: '8px' }}>Sideways (Range)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                15M Market Trend
              </label>
              <div className="relative">
                <select
                  name="trendM15"
                  value={formData.trendM15 ?? "Sideways"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Bullish" style={{ fontSize: '16px', padding: '8px' }}>Bullish (Uptrend)</option>
                  <option value="Bearish" style={{ fontSize: '16px', padding: '8px' }}>Bearish (Downtrend)</option>
                  <option value="Sideways" style={{ fontSize: '16px', padding: '8px' }}>Sideways (Range)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                5M Market Trend
              </label>
              <div className="relative">
                <select
                  name="trendM5"
                  value={formData.trendM5 ?? "Sideways"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Bullish" style={{ fontSize: '16px', padding: '8px' }}>Bullish (Uptrend)</option>
                  <option value="Bearish" style={{ fontSize: '16px', padding: '8px' }}>Bearish (Downtrend)</option>
                  <option value="Sideways" style={{ fontSize: '16px', padding: '8px' }}>Sideways (Range)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volume Profile
              </label>
              <div className="relative">
                <select
                  name="volumeProfile"
                  value={formData.volumeProfile ?? "Normal"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="Low" style={{ fontSize: '16px', padding: '8px' }}>Low Volume</option>
                  <option value="Normal" style={{ fontSize: '16px', padding: '8px' }}>Normal Volume</option>
                  <option value="High" style={{ fontSize: '16px', padding: '8px' }}>High Volume</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Quality & Psychology */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2">
            <BrainIcon />
            Trade Quality & Psychology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confidence Level (1-10)
              </label>
              <input
                type="number"
                name="confidenceLevel"
                value={formData.confidenceLevel === 5 || formData.confidenceLevel === 0 ? "" : (formData.confidenceLevel ?? "")}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min={1}
                max={10}
                step={1}
                className="w-full px-4 py-3 text-base md:text-sm bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all hover:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Setup Quality (1-10)
              </label>
              <input
                type="number"
                name="setupQuality"
                value={formData.setupQuality === 5 || formData.setupQuality === 0 ? "" : (formData.setupQuality ?? "")}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min={1}
                max={10}
                step={1}
                className="w-full px-4 py-3 text-base md:text-sm bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all hover:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trade Number (today)
              </label>
              <input
                type="number"
                name="tradeNumber"
                value={formData.tradeNumber === 1 || formData.tradeNumber === 0 ? "" : (formData.tradeNumber ?? "")}
                onChange={handleInputChange}
                onBlur={handleNumberBlur}
                min={1}
                step={1}
                className="w-full px-4 py-3 text-base md:text-sm bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500/50 transition-all hover:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Account Balance (₹)
              </label>
              <input
                type="number"
                name="accountBalance"
                value={formData.accountBalance ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your account balance <span className="font-semibold">before this trade</span>.
                Used only to auto-calculate risk % and position size % in Analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Review & Learning */}
        <div className="border-t border-gray-700/50 pt-6">
          <h3 className="text-lg md:text-base font-semibold mb-5 text-gray-100 flex items-center gap-2">
            <BookIcon />
            Review & Learning
          </h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="wouldTradeAgain"
                checked={formData.wouldTradeAgain ?? false}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-300">
                I would take this exact same setup again
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What worked well?
              </label>
              <textarea
                name="whatWorked"
                value={formData.whatWorked ?? ""}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
                placeholder="Entry timing, patience, following plan, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mistakes / What went wrong?
              </label>
              <div className="relative">
                <select
                  name="mistakes"
                  value={formData.mistakes ?? ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3.5 pr-12 text-lg md:text-base bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600 appearance-none cursor-pointer"
                  style={{ fontSize: '16px' }}
                >
                  <option value="" style={{ fontSize: '16px', padding: '8px' }}>Select a mistake (optional)</option>
                  <option value="FOMO" style={{ fontSize: '16px', padding: '8px' }}>FOMO (Fear of Missing Out)</option>
                  <option value="Early Entry" style={{ fontSize: '16px', padding: '8px' }}>Early Entry</option>
                  <option value="Early Exit" style={{ fontSize: '16px', padding: '8px' }}>Early Exit</option>
                  <option value="Revenge Trading" style={{ fontSize: '16px', padding: '8px' }}>Revenge Trading</option>
                  <option value="Overtrading" style={{ fontSize: '16px', padding: '8px' }}>Overtrading</option>
                  <option value="Not Following Plan" style={{ fontSize: '16px', padding: '8px' }}>Not Following Plan</option>
                  <option value="Moving Stop Loss" style={{ fontSize: '16px', padding: '8px' }}>Moving Stop Loss</option>
                  <option value="No Stop Loss" style={{ fontSize: '16px', padding: '8px' }}>No Stop Loss</option>
                  <option value="Holding Too Long" style={{ fontSize: '16px', padding: '8px' }}>Holding Too Long</option>
                  <option value="Cutting Winners Short" style={{ fontSize: '16px', padding: '8px' }}>Cutting Winners Short</option>
                  <option value="Adding to Losing Position" style={{ fontSize: '16px', padding: '8px' }}>Adding to Losing Position</option>
                  <option value="Trading on Emotions" style={{ fontSize: '16px', padding: '8px' }}>Trading on Emotions</option>
                  <option value="Ignoring Risk Management" style={{ fontSize: '16px', padding: '8px' }}>Ignoring Risk Management</option>
                  <option value="Chasing Price" style={{ fontSize: '16px', padding: '8px' }}>Chasing Price</option>
                  <option value="Missing Entry" style={{ fontSize: '16px', padding: '8px' }}>Missing Entry</option>
                  <option value="Lack of Patience" style={{ fontSize: '16px', padding: '8px' }}>Lack of Patience</option>
                  <option value="Trading Without Confirmation" style={{ fontSize: '16px', padding: '8px' }}>Trading Without Confirmation</option>
                  <option value="Overconfidence" style={{ fontSize: '16px', padding: '8px' }}>Overconfidence</option>
                  <option value="Underconfidence" style={{ fontSize: '16px', padding: '8px' }}>Underconfidence</option>
                  <option value="Distracted Trading" style={{ fontSize: '16px', padding: '8px' }}>Distracted Trading</option>
                  <option value="Not Following Checklist" style={{ fontSize: '16px', padding: '8px' }}>Not Following Checklist</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lessons learned
              </label>
              <textarea
                name="lessonsLearned"
                value={formData.lessonsLearned ?? ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 text-base md:text-sm bg-[#020617] border-2 border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400/50 transition-all hover:border-slate-600"
                placeholder="Concrete rules or insights you want to remember."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-gray-700/50 pt-6">
          {submitMessage && (
            <div
              className={`mb-4 p-3 rounded-md ${
                submitMessage.type === "success"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
              }`}
            >
              {submitMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-900 py-4 md:py-3 px-6 rounded-xl hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold text-base md:text-sm transition-all duration-200 shadow-lg shadow-amber-400/40 hover:shadow-xl hover:shadow-amber-400/60 active:scale-95"
          >
            {isSubmitting ? "Saving..." : "Save Trade"}
          </button>
        </div>
      </form>
    </div>
  );
}

