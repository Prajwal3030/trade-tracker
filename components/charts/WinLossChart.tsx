"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Trade } from "@/types/trade";

interface WinLossChartProps {
  trades: Trade[];
}

export default function WinLossChart({ trades }: WinLossChartProps) {
  const wins = trades.filter((t) => t.realizedPnL > 0).length;
  const losses = trades.filter((t) => t.realizedPnL < 0).length;
  const breakeven = trades.filter((t) => t.realizedPnL === 0).length;

  const data = [
    { name: "Wins", value: wins, color: "#10b981" },
    { name: "Losses", value: losses, color: "#ef4444" },
    { name: "Breakeven", value: breakeven, color: "#94a3b8" },
  ].filter((item) => item.value > 0);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent, value }) => {
              if (!percent || percent < 0.05) return ""; // Hide labels for small slices
              return `${name}\n${value} (${(percent * 100).toFixed(0)}%)`;
            }}
            outerRadius={90}
            innerRadius={30}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke="#0f172a"
                strokeWidth={2}
              />
            ))}
          </Pie>
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
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percent = ((value / total) * 100).toFixed(1);
              return [`${value} trades (${percent}%)`, name];
            }}
          />
          <Legend
            wrapperStyle={{ color: "#cbd5e1", fontSize: "11px", paddingTop: "10px" }}
            iconType="circle"
            iconSize={10}
            formatter={(value) => {
              const item = data.find(d => d.name === value);
              const total = data.reduce((sum, d) => sum + d.value, 0);
              const percent = item ? ((item.value / total) * 100).toFixed(1) : "0";
              return `${value} (${percent}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

