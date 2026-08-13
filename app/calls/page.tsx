"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { EmptyState, PageHeader, Panel, StatTile } from "@/components/admin-ui"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type CallsOverview = {
  activeCalls: number
  calls24h: number
  turnCalls7d: number
  p2pCalls7d: number
  avgDurationSeconds7d: number
  avgPacketLoss7d: number
  avgJitterMs7d: number
}

type CallRow = {
  id: string
  appointmentId: string | null
  mode: string
  status: string
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  disconnectReason: string | null
  usedTurn: boolean | null
  reconnectCount: number
  avgBitrateKbps: number | null
  avgPacketLoss: number | null
  avgJitterMs: number | null
  iceFinalState: string | null
  appointmentTitle: string | null
  durationSeconds: number
}

function fmtDuration(sec: number) {
  if (!sec || sec < 0) return "—"
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return `${m}m ${s}s`
}

function pathLabel(usedTurn: boolean | null) {
  if (usedTurn === true) return "TURN"
  if (usedTurn === false) return "P2P"
  return "—"
}

export default function CallsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [overview, setOverview] = useState<CallsOverview | null>(null)
  const [calls, setCalls] = useState<CallRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/")
    }
  }, [user, router])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ov, list] = await Promise.all([
        api.get<CallsOverview>("/admin/calls/overview"),
        api.get<{ items: CallRow[]; total: number }>("/admin/calls?limit=50"),
      ])
      setOverview(ov)
      setCalls(list.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === "admin") load()
  }, [load, user?.role])

  if (user && user.role !== "admin") {
    return null
  }

  return (
    <div>
      <PageHeader
        title="Call monitoring"
        description="WebRTC consultation quality — duration, ICE path, packet loss, and disconnect reasons. Admin only."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Calls" }]}
      />
      <p className="mb-4 text-sm text-muted-foreground">
        ICE provider (Janus / Static / Cloudflare):{" "}
        <Link href="/calls/settings" className="font-medium text-[#2F6F64] underline-offset-4 hover:underline">
          Call ICE settings
        </Link>
      </p>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Active now"
          value={loading ? "—" : String(overview?.activeCalls ?? 0)}
        />
        <StatTile
          label="Calls (24h)"
          value={loading ? "—" : String(overview?.calls24h ?? 0)}
        />
        <StatTile
          label="TURN vs P2P (7d)"
          value={
            loading
              ? "—"
              : `${overview?.turnCalls7d ?? 0} / ${overview?.p2pCalls7d ?? 0}`
          }
          hint="Relay / direct"
        />
        <StatTile
          label="Avg duration (7d)"
          value={
            loading ? "—" : fmtDuration(overview?.avgDurationSeconds7d ?? 0)
          }
          hint={
            loading
              ? undefined
              : `loss ${(overview?.avgPacketLoss7d ?? 0).toFixed(1)}% · jitter ${(overview?.avgJitterMs7d ?? 0).toFixed(0)} ms`
          }
        />
      </div>
      <Panel title="Recent calls">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : calls.length === 0 ? (
          <EmptyState
            title="No calls yet"
            description="Join a video appointment from the patient app to see quality metrics here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Path</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Loss %</TableHead>
                <TableHead className="text-right">Jitter</TableHead>
                <TableHead>ICE</TableHead>
                <TableHead>Disconnect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    <Link
                      href={`/calls/${c.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {new Date(c.createdAt).toLocaleString()}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[12rem] truncate text-sm">
                    {c.appointmentTitle ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm capitalize">{c.status}</TableCell>
                  <TableCell className="text-sm">{pathLabel(c.usedTurn)}</TableCell>
                  <TableCell className="text-right text-sm">
                    {fmtDuration(c.durationSeconds)}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {c.avgPacketLoss != null ? c.avgPacketLoss.toFixed(1) : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {c.avgJitterMs != null
                      ? `${c.avgJitterMs.toFixed(0)} ms`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.iceFinalState ?? "—"}</TableCell>
                  <TableCell className="max-w-[8rem] truncate text-sm text-muted-foreground">
                    {c.disconnectReason ?? "—"}
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
