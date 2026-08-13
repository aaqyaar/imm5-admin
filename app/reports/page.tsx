"use client"

import { useEffect, useState } from "react"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { GrowthChart } from "@/components/growth-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  api,
  type ChallengeParticipationRow,
  type UserGrowthRow,
} from "@/lib/api"

export default function ReportsPage() {
  const [growth, setGrowth] = useState<UserGrowthRow[]>([])
  const [participation, setParticipation] = useState<
    ChallengeParticipationRow[]
  >([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [g, p] = await Promise.all([
          api.get<UserGrowthRow[]>("/admin/reports/user-growth?days=90"),
          api.get<ChallengeParticipationRow[]>(
            "/admin/reports/challenge-participation"
          ),
        ])
        if (cancelled) return
        setGrowth(g ?? [])
        setParticipation(p ?? [])
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
    <div>
      <PageHeader
        title="Reports"
        description="Signup growth and walking challenge engagement."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Reports" }]}
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="space-y-6">
        <Panel title="User growth · 90 days">
          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            <GrowthChart data={growth} />
          )}
        </Panel>

        <Panel title="Challenge participation">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : participation.length === 0 ? (
            <EmptyState title="No challenge data yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challenge</TableHead>
                  <TableHead className="text-right">Participants</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participation.map((row) => {
                  const rate =
                    row.participants > 0
                      ? Math.round((row.completed / row.participants) * 100)
                      : 0
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell className="text-right">
                        {row.participants}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.completed}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {rate}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>
    </div>
  )
}
