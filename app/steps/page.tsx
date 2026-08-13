"use client"

import { useCallback, useEffect, useState } from "react"

import { EmptyState, PageHeader, Panel, StatTile } from "@/components/admin-ui"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type StepsOverview, type TopWalker } from "@/lib/api"

export default function StepsPage() {
  const [overview, setOverview] = useState<StepsOverview | null>(null)
  const [walkers, setWalkers] = useState<TopWalker[]>([])
  const [period, setPeriod] = useState<"week" | "month">("week")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, top] = await Promise.all([
        api.get<StepsOverview>("/admin/steps/overview"),
        api.get<TopWalker[]>(`/admin/steps/top?period=${period}`),
      ])
      setOverview(ov)
      setWalkers(top ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="Steps"
        description="Walking engagement across the last 7 days and top walkers."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Steps" }]}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={period === "week" ? "default" : "outline"}
              onClick={() => setPeriod("week")}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={period === "month" ? "default" : "outline"}
              onClick={() => setPeriod("month")}
            >
              Month
            </Button>
          </div>
        }
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active walkers"
          value={loading ? "—" : String(overview?.activeWalkers ?? 0)}
          hint="Logged steps in 7d"
        />
        <StatTile
          label="Total steps"
          value={
            loading ? "—" : Number(overview?.totalSteps ?? 0).toLocaleString()
          }
        />
        <StatTile
          label="Avg steps / log"
          value={
            loading ? "—" : Math.round(overview?.avgSteps ?? 0).toLocaleString()
          }
        />
        <StatTile
          label="Distance"
          value={
            loading
              ? "—"
              : `${Number(overview?.totalDistanceKm ?? 0).toFixed(1)} km`
          }
          hint={`${overview?.activeChallenges ?? 0} active challenges`}
        />
      </div>
      <Panel title="Top walkers">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : walkers.length === 0 ? (
          <EmptyState
            title="No step logs yet"
            description="Sync Health or wait for patient activity."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="text-right">Steps</TableHead>
                <TableHead className="text-right">Distance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walkers.map((w, i) => (
                <TableRow key={w.userId}>
                  <TableCell className="text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {w.firstName} {w.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{w.email}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(w.totalSteps).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(w.totalDistanceKm).toFixed(1)} km
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
