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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AdminEvent } from "@/lib/api"

type Rsvp = {
  userId: string
  firstName: string
  lastName: string
  email: string
  status: string
  createdAt?: string
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [rsvps, setRsvps] = useState<Rsvp[]>([])
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, r] = await Promise.all([
        api.get<{ items: AdminEvent[] }>("/admin/events?limit=100&offset=0"),
        api.get<Rsvp[]>(`/admin/events/${id}/rsvps`),
      ])
      setEvent((list.items ?? []).find((e) => e.id === id) ?? null)
      setRsvps(r ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load event")
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

  if (!event) return <EmptyState title="Event not found" />

  const going = rsvps.filter((r) => r.status === "going").length
  const interested = rsvps.filter((r) => r.status === "interested").length

  return (
    <DetailShell
      backHref="/events"
      backLabel="Events"
      title={event.title}
      subtitle={event.description || undefined}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Events", href: "/events" },
        { label: event.title },
      ]}
      badges={
        <>
          <Badge variant="secondary" className="capitalize">
            {event.kind}
          </Badge>
          <Badge variant="outline">
            {event.startsAt
              ? new Date(event.startsAt).toLocaleString()
              : "No date"}
          </Badge>
        </>
      }
      actions={
        <Link
          href="/events"
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          Back to list
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Going"
          value={String(going || event.goingCount || 0)}
        />
        <StatTile label="Interested" value={String(interested)} />
        <StatTile label="Total RSVPs" value={String(rsvps.length)} />
      </div>

      <SectionTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "rsvps", label: "RSVPs", count: rsvps.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Panel title="Record">
          <FieldGrid cols={3}>
            <Field label="Title" value={event.title} />
            <Field label="Kind" value={event.kind} />
            <Field label="Location" value={event.location || "—"} />
            <Field
              label="Starts"
              value={
                event.startsAt ? new Date(event.startsAt).toLocaleString() : "—"
              }
            />
            <Field
              label="Host"
              value={
                event.hostFirstName
                  ? `${event.hostFirstName} ${event.hostLastName ?? ""}`.trim()
                  : "—"
              }
            />
            <Field label="Going" value={String(event.goingCount ?? going)} />
            <Field
              label="Description"
              value={event.description || "—"}
              className="sm:col-span-3"
            />
          </FieldGrid>
        </Panel>
      ) : (
        <Panel title="RSVPs" description="Who said they are coming">
          {rsvps.length === 0 ? (
            <EmptyState title="No RSVPs yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rsvps.map((r) => (
                  <TableRow key={r.userId + r.status}>
                    <TableCell className="font-medium">
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      )}
    </DetailShell>
  )
}
