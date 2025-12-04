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

interface RRChartProps {
  trades: Trade[];
}

// Define intuitive R:R buckets
const RR_BUCKETS = [
  { key: "<0", label: "< 0R (losing)" },
  { key: "0-1", label: "0 – 1R" },
  { key: "1-2", label: "1 – 2R" },
  { key: "2-3", label: "2 – 3R" },
  { key: ">3", label: "> 3R" },
];

function bucketForRR(rr: number): string {
  if (rr < 0) return "<0";
  if (rr < 1) return "0-1";
  if (rr < 2) return "1-2";
  if (rr < 3) return "2-3";
  return ">3";
}

export default function RRChart({ trades }: RRChartProps) {
  const counts: Record<string, number> = {};

  trades.forEach((t) => {
    const rr = Number.isFinite(t.realizedRR) ? t.realizedRR : 0;
    const bucketKey = bucketForRR(rr);
    counts[bucketKey] = (counts[bucketKey] || 0) + 1;
  });

  const chartData = RR_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    count: counts[b.key] ?? 0,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <XAxis
            dataKey="label"
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
            label={{
              value: "Risk:Reward Bucket",
              position: "insideBottom",
              offset: -5,
              style: { fill: "#94a3b8", fontSize: "11px" },
            }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "11px", fontWeight: 500 }}
            tick={{ fill: "#94a3b8" }}
            label={{
              value: "Number of Trades",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#94a3b8", fontSize: "11px" },
            }}
            allowDecimals={false}
            minTickGap={1}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "12px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
            }}
            labelStyle={{
              color: "#e2e8f0",
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "4px",
            }}
            formatter={(value: number) => [
              `${value} trade${value !== 1 ? "s" : ""}`,
              "Count",
            ]}
            labelFormatter={(label, payload: any) => {
              const item =
                Array.isArray(payload) && payload[0] ? payload[0].payload : null;
              const text = item?.label ?? label;
              return `Bucket: ${text}`;
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Trades">
            {chartData.map((entry) => {
              let fill = "#f97316"; // default orange
              if (entry.key === "<0") fill = "#ef4444"; // red for losing trades
              if (entry.key === "1-2") fill = "#22c55e"; // green for decent wins
              if (entry.key === "2-3" || entry.key === ">3") fill = "#16a34a"; // strong green for big R:R
              return <Cell key={entry.key} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

