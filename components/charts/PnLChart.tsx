"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Trade } from "@/types/trade";

interface PnLChartProps {
  trades: Trade[];
}

export default function PnLChart({ trades }: PnLChartProps) {
  // Sort trades by entry time
  const sortedTrades = [...trades].sort(
    (a, b) =>
      new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  // Calculate cumulative P&L
  let cumulativePnL = 0;
  const chartData = sortedTrades.map((trade, index) => {
    cumulativePnL += trade.realizedPnL;
    return {
      trade: `Trade ${index + 1}`,
      pnl: trade.realizedPnL,
      cumulative: cumulativePnL,
      date: new Date(trade.entryTime).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
    };
  });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="trade"
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
            tickFormatter={(value) => {
              if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
              return `₹${value}`;
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            }}
            labelStyle={{ color: "#e2e8f0", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}
            formatter={(value: number, name: string) => {
              const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(value);
              return [formatted, name === "pnl" ? "P&L per Trade" : "Cumulative P&L"];
            }}
            labelFormatter={(label) => `Trade: ${label}`}
          />
          <Legend
            wrapperStyle={{ color: "#cbd5e1", fontSize: "11px", paddingTop: "10px" }}
            iconType="line"
            iconSize={12}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#06b6d4"
            strokeWidth={2.5}
            dot={{ fill: "#06b6d4", r: 3, strokeWidth: 2, stroke: "#0e7490" }}
            activeDot={{ r: 5, stroke: "#06b6d4", strokeWidth: 2 }}
            name="P&L per Trade"
          />
          <Line
            type="monotone"
            dataKey="cumulative"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ fill: "#10b981", r: 3, strokeWidth: 2, stroke: "#059669" }}
            activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2 }}
            name="Cumulative P&L"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

