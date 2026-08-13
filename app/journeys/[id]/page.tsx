"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  DetailShell,
  EmptyState,
  Field,
  FieldGrid,
  Panel,
  SectionTabs,
  StatTile,
} from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { api, type AdminJourney } from "@/lib/api"

type ProgressStats = {
  starters: number
  avgDistanceKm: number
  totalDistanceKm: number
}

type Landmark = { name?: string; km?: number }

export default function JourneyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [journey, setJourney] = useState<AdminJourney | null>(null)
  const [stats, setStats] = useState<ProgressStats | null>(null)
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, progress] = await Promise.all([
        api.get<AdminJourney[]>("/admin/journeys"),
        api.get<ProgressStats>(`/admin/journeys/${id}/progress`),
      ])
      setJourney((list ?? []).find((j) => j.id === id) ?? null)
      setStats(progress)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load journey")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!journey) {
    return <EmptyState title="Journey not found" />
  }

  const landmarks = (
    Array.isArray(journey.landmarks) ? journey.landmarks : []
  ) as Landmark[]
  const pctAvg =
    journey.goalKm > 0 && stats
      ? Math.min(
          100,
          Math.round(
            (Number(stats.avgDistanceKm) / Number(journey.goalKm)) * 100
          )
        )
      : 0

  return (
    <DetailShell
      backHref="/journeys"
      backLabel="Journeys"
      title={journey.title}
      subtitle={journey.description || undefined}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Journeys", href: "/journeys" },
        { label: journey.title },
      ]}
      badges={
        <>
          <Badge variant="secondary" className="font-mono">
            {journey.slug}
          </Badge>
          <Badge variant="outline">
            {Number(journey.goalKm).toLocaleString()} km
          </Badge>
        </>
      }
      actions={
        <Link
          href="/journeys"
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          Back to list
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Starters"
          value={String(stats?.starters ?? journey.starters ?? 0)}
        />
        <StatTile
          label="Avg distance"
          value={`${Number(stats?.avgDistanceKm ?? 0).toFixed(1)} km`}
          hint={`${pctAvg}% of goal on average`}
        />
        <StatTile
          label="Total walked"
          value={`${Number(stats?.totalDistanceKm ?? 0).toFixed(1)} km`}
        />
      </div>

      <SectionTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "landmarks", label: "Landmarks", count: landmarks.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Panel title="Record">
          <FieldGrid cols={3}>
            <Field label="Title" value={journey.title} />
            <Field label="Slug" value={journey.slug} />
            <Field label="Sort order" value={String(journey.sortOrder ?? 0)} />
            <Field
              label="Goal"
              value={`${Number(journey.goalKm).toLocaleString()} km`}
            />
            <Field label="Starters" value={String(stats?.starters ?? 0)} />
            <Field label="Avg progress" value={`${pctAvg}%`} />
            <Field
              label="Description"
              value={journey.description || "—"}
              className="sm:col-span-3"
            />
          </FieldGrid>
        </Panel>
      ) : (
        <Panel
          title="Landmarks"
          description="Milestones along the virtual route"
        >
          {landmarks.length === 0 ? (
            <EmptyState title="No landmarks" />
          ) : (
            <ol className="space-y-3">
              {landmarks.map((lm, i) => (
                <li
                  key={`${lm.name}-${i}`}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="font-medium">
                      {lm.name || `Point ${i + 1}`}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {lm.km != null ? `${lm.km} km` : "—"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      )}
    </DetailShell>
  )
}
