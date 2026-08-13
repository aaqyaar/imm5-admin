"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AdminEvent } from "@/lib/api"

const EMPTY = {
  title: "",
  description: "",
  kind: "community",
  startsAt: "",
  location: "",
}

export default function EventsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEvent | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: AdminEvent[]; total: number }>(
        "/admin/events?limit=100&offset=0"
      )
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function toLocalInput(iso: string) {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function onSave() {
    setBusy(true)
    try {
      const startsAt = new Date(form.startsAt).toISOString()
      const body = { ...form, startsAt }
      if (editing) {
        await api.put(`/admin/events/${editing.id}`, body)
        toast.success("Event updated")
      } else {
        await api.post("/admin/events", body)
        toast.success("Event created")
      }
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Community walks. Open an event for the full RSVP picture."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Events" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              const d = new Date()
              d.setDate(d.getDate() + 7)
              setForm({ ...EMPTY, startsAt: toLocalInput(d.toISOString()) })
              setOpen(true)
            }}
          >
            New event
          </Button>
        }
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState title="No events" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead className="text-right">Going</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow
                    key={e.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => router.push(`/events/${e.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.location || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.startsAt ? new Date(e.startsAt).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {e.goingCount ?? 0}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/events/${e.id}`}
                          className="inline-flex h-8 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
                        >
                          Open
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(e)
                            setForm({
                              title: e.title,
                              description: e.description ?? "",
                              kind: e.kind,
                              startsAt: toLocalInput(e.startsAt),
                              location: e.location ?? "",
                            })
                            setOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm("Delete event?")) return
                            try {
                              await api.del(`/admin/events/${e.id}`)
                              toast.success("Deleted")
                              await load()
                            } catch (err) {
                              toast.error(
                                err instanceof Error ? err.message : "Failed"
                              )
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">{total} events</p>
          </>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kind</Label>
                <select
                  className="h-9 w-full rounded-xl border border-input px-3 text-sm"
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  {["community", "charity", "workplace", "family"].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm({ ...form, startsAt: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={busy || !form.title || !form.startsAt}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
