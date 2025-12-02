"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Trade } from "@/types/trade";

interface DailyChartProps {
  trades: Trade[];
}

export default function DailyChart({ trades }: DailyChartProps) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const buckets: Record<number, { count: number; pnl: number }> = {};
  
  trades.forEach((t) => {
    const day =
      typeof t.dayOfWeek === "number"
        ? t.dayOfWeek
        : new Date(t.entryTime).getDay();
    if (!buckets[day]) buckets[day] = { count: 0, pnl: 0 };
    buckets[day].count += 1;
    buckets[day].pnl += t.realizedPnL;
  });

  const chartData = names.map((name, index) => ({
    day: name,
    pnl: buckets[index] ? Number(buckets[index].pnl.toFixed(2)) : 0,
    trades: buckets[index]?.count || 0,
    color: buckets[index] && buckets[index].pnl >= 0 ? "#10b981" : "#ef4444",
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="day"
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
            formatter={(value: number, name: string, props: any) => {
              const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
              }).format(value);
              return [
                formatted,
                `P&L (${props.payload.trades} trade${props.payload.trades !== 1 ? "s" : ""})`
              ];
            }}
            labelFormatter={(label) => `Day: ${label}`}
          />
          <Bar
            dataKey="pnl"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
            name="P&L"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

