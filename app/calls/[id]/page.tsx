"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

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

type CallDetail = {
  call: {
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
    durationSeconds: number
  }
  participants: {
    id: string
    userId: string
    role: string
    joinedAt: string | null
    leftAt: string | null
    reconnectCount?: number
    iceFinalState?: string | null
    usedTurn?: boolean | null
    disconnectReason?: string | null
  }[]
  reports: {
    id: string
    userId: string
    reportedAt: string
    iceConnectionState: string | null
    candidateType: string | null
    bitrateKbps: number | null
    packetLoss: number | null
    jitterMs: number | null
    audioLevel: number | null
    rttMs: number | null
    reconnectCount: number
  }[]
}

export default function CallDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<CallDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/")
  }, [user, router])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      setData(await api.get<CallDetail>(`/admin/calls/${id}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (user?.role === "admin") load()
  }, [load, user?.role])

  if (user && user.role !== "admin") return null

  const call = data?.call

  return (
    <div>
      <PageHeader
        title="Call detail"
        description="Per-participant join times and quality samples."
        breadcrumbs={[
          { label: "Modules", href: "/" },
          { label: "Calls", href: "/calls" },
          { label: id?.slice(0, 8) ?? "…" },
        ]}
        actions={
          <Link href="/calls" className="text-sm text-primary hover:underline">
            ← All calls
          </Link>
        }
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {loading || !call ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Status" value={call.status} />
            <StatTile
              label="Duration"
              value={`${Math.floor(call.durationSeconds / 60)}m ${Math.round(call.durationSeconds % 60)}s`}
            />
            <StatTile
              label="Path"
              value={
                call.usedTurn === true
                  ? "TURN"
                  : call.usedTurn === false
                    ? "P2P"
                    : "—"
              }
              hint={`reconnects ${call.reconnectCount}`}
            />
            <StatTile
              label="Quality"
              value={
                call.avgPacketLoss != null
                  ? `${call.avgPacketLoss.toFixed(1)}% loss`
                  : "—"
              }
              hint={
                call.avgJitterMs != null
                  ? `${call.avgJitterMs.toFixed(0)} ms jitter`
                  : undefined
              }
            />
          </div>
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Participants">
              {(data?.participants?.length ?? 0) === 0 ? (
                <EmptyState title="No participants" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Left</TableHead>
                      <TableHead>Disconnect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.participants.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="capitalize">{p.role}</TableCell>
                        <TableCell className="text-sm">
                          {p.joinedAt
                            ? new Date(p.joinedAt).toLocaleTimeString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {p.leftAt
                            ? new Date(p.leftAt).toLocaleTimeString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.disconnectReason ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Panel>
            <Panel title="Session">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Mode</dt>
                  <dd>{call.mode}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">ICE final</dt>
                  <dd>{call.iceFinalState ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Avg bitrate</dt>
                  <dd>
                    {call.avgBitrateKbps != null
                      ? `${call.avgBitrateKbps.toFixed(0)} kbps`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Disconnect</dt>
                  <dd>{call.disconnectReason ?? "—"}</dd>
                </div>
              </dl>
            </Panel>
          </div>
          <Panel title="Quality samples">
            {(data?.reports?.length ?? 0) === 0 ? (
              <EmptyState
                title="No samples yet"
                description="Clients POST /calls/:id/metrics during the call."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>ICE</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead className="text-right">Bitrate</TableHead>
                    <TableHead className="text-right">Loss %</TableHead>
                    <TableHead className="text-right">Jitter</TableHead>
                    <TableHead className="text-right">RTT</TableHead>
                    <TableHead className="text-right">Audio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(r.reportedAt).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.iceConnectionState ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.candidateType ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.bitrateKbps != null
                          ? r.bitrateKbps.toFixed(0)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.packetLoss != null ? r.packetLoss.toFixed(1) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.jitterMs != null ? r.jitterMs.toFixed(0) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.rttMs != null ? r.rttMs.toFixed(0) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {r.audioLevel != null
                          ? r.audioLevel.toFixed(2)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Panel>
        </>
      )}
    </div>
  )
}
