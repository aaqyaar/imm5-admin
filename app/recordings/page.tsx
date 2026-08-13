"use client"

import { useCallback, useEffect, useState } from "react"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { API_URL, api, tokens } from "@/lib/api"

type RecordingRow = {
  id: string
  callId: string
  appointmentId: string | null
  title: string
  mimeType: string
  byteSize: number
  durationSeconds: number | null
  source: string
  createdAt: string
  appointmentTitle: string
  uploaderFirstName: string
  uploaderLastName: string
  streamPath: string
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export default function RecordingsPage() {
  const [items, setItems] = useState<RecordingRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<RecordingRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ items: RecordingRow[] }>(
        "/admin/recordings?limit=100"
      )
      setItems(res.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader
        title="Recordings"
        description="Consultation recordings — metadata in Postgres, media files on disk (S3-ready)."
        breadcrumbs={[
          { label: "Modules", href: "/" },
          { label: "Recordings" },
        ]}
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {playing ? (
        <Panel
          title={playing.title || "Playback"}
          className="mb-6"
          action={
            <Button size="sm" variant="outline" onClick={() => setPlaying(null)}>
              Close
            </Button>
          }
        >
          <AuthMedia streamPath={playing.streamPath} mimeType={playing.mimeType} />
        </Panel>
      ) : null}
      <Panel title="Library">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No recordings yet"
            description="Use Record during a call in Appointments → Join call, or from the patient app."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Uploader</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(r.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{r.title}</TableCell>
                  <TableCell className="text-sm">
                    {r.appointmentTitle || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.source}</TableCell>
                  <TableCell className="text-sm">
                    {r.uploaderFirstName} {r.uploaderLastName}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {fmtBytes(r.byteSize)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPlaying(r)}
                    >
                      Play
                    </Button>
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

function AuthMedia({
  streamPath,
  mimeType,
}: {
  streamPath: string
  mimeType: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    ;(async () => {
      try {
        tokens.hydrate()
        const origin = API_URL.replace(/\/api\/v1\/?$/, "")
        const res = await fetch(`${origin}${streamPath}`, {
          headers: { Authorization: `Bearer ${tokens.access ?? ""}` },
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(
          blob.type ? blob : new Blob([blob], { type: mimeType })
        )
        setUrl(objectUrl)
      } catch (e) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Playback failed")
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [streamPath, mimeType])

  if (err) return <p className="text-sm text-destructive">{err}</p>
  if (!url)
    return <p className="text-sm text-muted-foreground">Loading media…</p>
  if (mimeType.startsWith("audio/")) {
    return <audio controls src={url} className="w-full" />
  }
  return (
    <video
      controls
      src={url}
      className="max-h-[420px] w-full rounded-lg bg-black"
    />
  )
}
