"use client"

import { useEffect, useState } from "react"

import { PageHeader, Panel, StatTile } from "@/components/admin-ui"
import { GrowthChart } from "@/components/growth-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type AdminStats, type UserGrowthRow } from "@/lib/api"

function fmt(n: number | null | undefined, digits = 0) {
  if (n == null || Number.isNaN(n)) return "—"
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

export default function OverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [growth, setGrowth] = useState<UserGrowthRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [s, g] = await Promise.all([
          api.get<AdminStats>("/admin/stats"),
          api.get<UserGrowthRow[]>("/admin/reports/user-growth?days=30"),
        ])
        if (cancelled) return
        setStats(s)
        setGrowth(g ?? [])
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="System insights — patients, engagement, and programme health."
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading || !stats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatTile label="Total patients" value={fmt(stats.totalUsers)} />
          <StatTile
            label="Active 7d"
            value={fmt(stats.activeUsers7d)}
            hint="Logged activity this week"
          />
          <StatTile label="Challenges" value={fmt(stats.totalChallenges)} />
          <StatTile
            label="Avg steps 7d"
            value={fmt(Math.round(stats.avgStepsLast7d))}
          />
          <StatTile
            label="Avg weight Δ"
            value={`${stats.avgWeightChangeKg > 0 ? "+" : ""}${fmt(stats.avgWeightChangeKg, 1)} kg`}
            hint="Across patients with ≥2 readings"
          />
        </div>
      )}

      <Panel title="Patient growth · 30 days" description="New signups per day">
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <GrowthChart data={growth} />
        )}
      </Panel>
    </div>
  )
}
