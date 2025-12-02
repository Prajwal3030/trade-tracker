"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Trade } from "@/types/trade";

interface RRChartProps {
  trades: Trade[];
}

export default function RRChart({ trades }: RRChartProps) {
  // Group R:R into buckets
  const buckets: Record<string, number> = {};
  
  trades.forEach((t) => {
    const rr = Math.round(t.realizedRR * 2) / 2; // Round to nearest 0.5
    const key = rr < 0 ? "< 0" : `${rr.toFixed(1)}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const chartData = Object.entries(buckets)
    .map(([range, count]) => ({
      range,
      count,
    }))
    .sort((a, b) => {
      if (a.range === "< 0") return -1;
      if (b.range === "< 0") return 1;
      return parseFloat(a.range) - parseFloat(b.range);
    });

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="range"
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
            label={{ value: "Risk:Reward Ratio", position: "insideBottom", offset: -5, style: { fill: "#94a3b8", fontSize: "11px" } }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
            label={{ value: "Number of Trades", angle: -90, position: "insideLeft", style: { fill: "#94a3b8", fontSize: "11px" } }}
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
            formatter={(value: number) => [`${value} trade${value !== 1 ? "s" : ""}`, "Count"]}
            labelFormatter={(label) => `R:R Ratio: ${label}`}
          />
          <Bar
            dataKey="count"
            fill="#f59e0b"
            radius={[6, 6, 0, 0]}
            name="Trades"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

