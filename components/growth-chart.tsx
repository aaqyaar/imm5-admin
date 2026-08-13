"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { UserGrowthRow } from "@/lib/api"

export function GrowthChart({ data }: { data: UserGrowthRow[] }) {
  const series = data.map((d) => ({
    day: typeof d.day === "string" ? d.day.slice(0, 10) : String(d.day),
    count: Number(d.count),
  }))

  if (series.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No signups in this period yet.
      </p>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={series}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2F6F64" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#2F6F64" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E0DED8"
            vertical={false}
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#6B6A66" }}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "#6B6A66" }}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E0DED8",
              background: "#fff",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#2F6F64"
            strokeWidth={2}
            fill="url(#growthFill)"
            name="Signups"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
