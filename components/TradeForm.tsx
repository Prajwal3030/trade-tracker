"use client";

import { useState, useEffect } from "react";
import { saveTrade, updateTrade } from "@/lib/trades";
import { Trade, Checklist } from "@/types/trade";

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
  const [formData, setFormData] = useState<Omit<Trade, "id">>({
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
    partialExit: false,
    trailingStopUsed: false,
    breakevenMoved: false,
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

  // When editing, hydrate form with existing trade
  useEffect(() => {
    if (mode === "edit" && tradeToEdit) {
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
    }
  }, [mode, tradeToEdit]);

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

    const peakPerUnit =
      (formData.maxFavorableExcursion ?? 0) - formData.optionEntryPrice;
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

  // Calculate isAdherent based on checklist
  useEffect(() => {
    const checklist = formData.checklist;
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
  }, [formData.checklist]);

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
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "number"
            ? parseFloat(value) || 0
            : type === "checkbox"
            ? checked
            : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      if (mode === "edit" && tradeToEdit?.id) {
        await updateTrade(tradeToEdit.id, {
          ...formData,
          entryTime: new Date(formData.entryTime),
          exitTime: new Date(formData.exitTime),
        });
      } else {
        await saveTrade({
          ...formData,
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
          partialExit: false,
          trailingStopUsed: false,
          breakevenMoved: false,
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {mode === "edit" ? "Edit Trade" : "Log New Trade"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Trade Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset/Instrument *
            </label>
            <input
              type="text"
              name="asset"
              value={formData.asset}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., NIFTY, EURUSD"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Strategy ID *
            </label>
            <select
              name="strategyId"
              value={formData.strategyId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Setup 1">Setup 1</option>
              <option value="Setup 2">Setup 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction *
            </label>
            <select
              name="direction"
              value={formData.direction}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Time *
            </label>
            <input
              type="datetime-local"
              name="entryTime"
              value={
                formData.entryTime instanceof Date
                  ? formData.entryTime.toISOString().slice(0, 16)
                  : formData.entryTime
              }
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Time *
            </label>
            <input
              type="datetime-local"
              name="exitTime"
              value={
                formData.exitTime instanceof Date
                  ? formData.exitTime.toISOString().slice(0, 16)
                  : formData.exitTime
              }
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Reason *
            </label>
            <select
              name="exitReason"
              value={formData.exitReason}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SL Hit">SL Hit</option>
              <option value="TP Hit">TP Hit</option>
              <option value="Manual">Manual</option>
              <option value="Time Limit">Time Limit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Emotional State *
            </label>
            <select
              name="emotionalState"
              value={formData.emotionalState}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Calm">Calm</option>
              <option value="Greedy">Greedy</option>
              <option value="Fearful">Fearful</option>
              <option value="Rushed">Rushed</option>
              <option value="Revenge">Revenge</option>
            </select>
          </div>
        </div>

        {/* Pricing & Position */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Pricing & Position
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option Entry Price (₹) *
              </label>
              <input
                type="number"
                name="optionEntryPrice"
                value={formData.optionEntryPrice}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Option Exit Price (₹) *
              </label>
              <input
                type="number"
                name="optionExitPrice"
                value={formData.optionExitPrice}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Planned Stop Loss Price (₹)
              </label>
              <input
                type="number"
                name="stopLossPrice"
                value={formData.stopLossPrice ?? 0}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Used to auto-calc risk: |Entry - SL| × Position Size.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Size (Lots) *
              </label>
              <input
                type="number"
                name="positionSize"
                value={formData.positionSize}
                onChange={handleInputChange}
                required
                step="1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target / Expected Price (₹) *
              </label>
              <input
                type="number"
                name="initialReward"
                value={formData.initialReward}
                onChange={handleInputChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Option price you expect to exit at when the trade hits target.
              </p>
            </div>
          </div>

          {/* Calculated Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Realized P&L (₹)
              </label>
              <div className="text-lg font-semibold text-gray-800">
                ₹{formData.realizedPnL.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Realized R:R
              </label>
              <div className="text-lg font-semibold text-gray-800">
                {formData.realizedRR.toFixed(2)}
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected R:R
              </label>
              <div className="text-lg font-semibold text-gray-800">
                {formData.expectedRR?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Trade Checklist
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="checklist.H1_TrendAligned"
                checked={formData.checklist.H1_TrendAligned}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                1H Bias aligned with trade direction
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="checklist.M15_TrendAligned"
                checked={formData.checklist.M15_TrendAligned}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                15M Bias aligned with trade direction
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="checklist.M05_StructureMet"
                checked={formData.checklist.M05_StructureMet}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                5M Structure Met (
                {formData.strategyId === "Setup 1"
                  ? "Approached Key Level"
                  : "5M HH/HL or LH/LL"}
                )
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmations (comma-separated) *
              </label>
              <input
                type="text"
                name="checklist.Confirmations"
                value={formData.checklist.Confirmations}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., BoS, Liquidity Grab, OB Test, Reversal Candle, Trend Line Bounce"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="checklist.ExitRuleFollowed"
                checked={formData.checklist.ExitRuleFollowed}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Exit rule matched initial plan or management rules
              </span>
            </label>
          </div>

          <div className="mt-4 bg-blue-50 p-3 rounded-md">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isAdherent}
                disabled
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Trade Adherent (Auto-calculated)
              </span>
            </label>
          </div>
        </div>

        {/* Performance Tracking */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Trade Performance Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Favorable Excursion (₹)
              </label>
              <input
                type="number"
                name="maxFavorableExcursion"
                value={formData.maxFavorableExcursion ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Adverse Excursion (₹)
              </label>
              <input
                type="number"
                name="maxAdverseExcursion"
                value={formData.maxAdverseExcursion ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peak Profit (₹)
              </label>
              <input
                type="number"
                name="peakProfit"
                value={formData.peakProfit ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time to Peak (minutes)
              </label>
              <input
                type="number"
                name="timeToPeakMinutes"
                value={formData.timeToPeakMinutes ?? 0}
                onChange={handleInputChange}
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Market Conditions */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Market Conditions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volatility
              </label>
              <select
                name="volatility"
                value={formData.volatility ?? "Medium"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1H Market Trend
              </label>
              <select
                name="trendH1"
                value={formData.trendH1 ?? "Sideways"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bullish">Bullish</option>
                <option value="Bearish">Bearish</option>
                <option value="Sideways">Sideways</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                15M Market Trend
              </label>
              <select
                name="trendM15"
                value={formData.trendM15 ?? "Sideways"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bullish">Bullish</option>
                <option value="Bearish">Bearish</option>
                <option value="Sideways">Sideways</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                5M Market Trend
              </label>
              <select
                name="trendM5"
                value={formData.trendM5 ?? "Sideways"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Bullish">Bullish</option>
                <option value="Bearish">Bearish</option>
                <option value="Sideways">Sideways</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume Profile
              </label>
              <select
                name="volumeProfile"
                value={formData.volumeProfile ?? "Normal"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Trade Quality & Psychology */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Trade Quality & Psychology
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Level (1-10)
              </label>
              <input
                type="number"
                name="confidenceLevel"
                value={formData.confidenceLevel ?? 5}
                onChange={handleInputChange}
                min={1}
                max={10}
                step={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setup Quality (1-10)
              </label>
              <input
                type="number"
                name="setupQuality"
                value={formData.setupQuality ?? 5}
                onChange={handleInputChange}
                min={1}
                max={10}
                step={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trade Number (today)
              </label>
              <input
                type="number"
                name="tradeNumber"
                value={formData.tradeNumber ?? 1}
                onChange={handleInputChange}
                min={1}
                step={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Balance (₹)
              </label>
              <input
                type="number"
                name="accountBalance"
                value={formData.accountBalance ?? 0}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter your account balance <span className="font-semibold">before this trade</span>.
                Used only to auto-calculate risk % and position size % in Analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Refinement */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Strategy Refinement
          </h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="partialExit"
                checked={formData.partialExit ?? false}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Took partial exits during the trade
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="trailingStopUsed"
                checked={formData.trailingStopUsed ?? false}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Used trailing stop management
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="breakevenMoved"
                checked={formData.breakevenMoved ?? false}
                onChange={handleInputChange}
                className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Moved stop-loss to breakeven
              </span>
            </label>
          </div>
        </div>

        {/* Review & Learning */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
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
              <span className="text-sm text-gray-700">
                I would take this exact same setup again
              </span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What worked well?
              </label>
              <textarea
                name="whatWorked"
                value={formData.whatWorked ?? ""}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Entry timing, patience, following plan, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mistakes / What went wrong?
              </label>
              <textarea
                name="mistakes"
                value={formData.mistakes ?? ""}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Emotional decisions, missed rules, management errors, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lessons learned
              </label>
              <textarea
                name="lessonsLearned"
                value={formData.lessonsLearned ?? ""}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Concrete rules or insights you want to remember."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t pt-4">
          {submitMessage && (
            <div
              className={`mb-4 p-3 rounded-md ${
                submitMessage.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {submitMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? "Saving..." : "Save Trade"}
          </button>
        </div>
      </form>
    </div>
  );
}

