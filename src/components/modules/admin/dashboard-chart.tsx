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
import { formatRupiah } from "@/lib/format";

export function DashboardChart({
  data,
}: {
  data: { date: string; revenue: number }[];
}) {
  return (
    <div className="w-full h-[250px] mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: "#94a3b8" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fontSize: 10, fill: "#94a3b8" }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(value) => `Rp${value / 1000}k`}
          />
          <Tooltip 
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
              fontWeight: 600
            }}
            formatter={(value: any) => [formatRupiah(Number(value)), "Omset"]}
            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
          />
          <Bar 
            dataKey="revenue" 
            fill="#4f46e5" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
