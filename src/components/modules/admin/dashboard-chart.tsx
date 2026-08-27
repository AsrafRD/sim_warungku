"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah } from "@/lib/format";

export function DashboardChart({
  data,
}: {
  data: { date: string; revenue: number; profit: number }[];
}) {
  return (
    <div className="w-full h-[250px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f1f5f9"
          />

          <XAxis
            dataKey="date"
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
          />

          <YAxis
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            axisLine={false}
            tickLine={false}
            width={45}
            tickFormatter={(value: number) => {
              if (value >= 1_000_000) {
                return `Rp${value / 1_000_000}jt`;
              }

              if (value >= 1_000) {
                return `Rp${value / 1_000}k`;
              }

              return `Rp${value}`;
            }}
          />

          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow:
                "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
              fontWeight: 600,
            }}
            formatter={(value, name) => [
              formatRupiah(Number(value)),
              name === "revenue" ? "Omset" : "Laba"
            ]}
            labelStyle={{
              color: "#64748b",
              marginBottom: "4px",
            }}
          />

          <Bar
            dataKey="revenue"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            animationDuration={700}
            fill="#FF8F00"
          />

          <Bar
            dataKey="profit"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
            animationDuration={700}
            fill="#10b981"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
