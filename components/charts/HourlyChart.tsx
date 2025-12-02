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

interface HourlyChartProps {
  trades: Trade[];
}

export default function HourlyChart({ trades }: HourlyChartProps) {
  const buckets: Record<number, { count: number; pnl: number }> = {};
  
  trades.forEach((t) => {
    const hour =
      typeof t.entryHour === "number"
        ? t.entryHour
        : new Date(t.entryTime).getHours();
    if (!buckets[hour]) buckets[hour] = { count: 0, pnl: 0 };
    buckets[hour].count += 1;
    buckets[hour].pnl += t.realizedPnL;
  });

  const chartData = Object.entries(buckets)
    .map(([hour, v]) => ({
      hour: `${hour}:00`,
      pnl: Number(v.pnl.toFixed(2)),
      trades: v.count,
      color: v.pnl >= 0 ? "#10b981" : "#ef4444",
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="hour"
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
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Bar
            dataKey="pnl"
            fill="#06b6d4"
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

