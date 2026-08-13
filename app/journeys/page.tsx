"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
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
import { api, type AdminJourney } from "@/lib/api"

const EMPTY = {
  slug: "",
  title: "",
  description: "",
  goalKm: 100,
  sortOrder: 1,
  landmarks: "[]",
}

export default function JourneysPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminJourney[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminJourney | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await api.get<AdminJourney[]>("/admin/journeys"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onSave() {
    setBusy(true)
    try {
      let landmarks: unknown = []
      try {
        landmarks = JSON.parse(form.landmarks || "[]")
      } catch {
        toast.error("Landmarks must be valid JSON")
        setBusy(false)
        return
      }
      const body = {
        slug: form.slug,
        title: form.title,
        description: form.description,
        goalKm: form.goalKm,
        sortOrder: form.sortOrder,
        landmarks,
      }
      if (editing) {
        await api.put(`/admin/journeys/${editing.id}`, body)
        toast.success("Journey updated")
      } else {
        await api.post("/admin/journeys", body)
        toast.success("Journey created")
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
        title="Journeys"
        description="Virtual walking journeys. Open a journey for landmarks and starter stats."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Journeys" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setForm(EMPTY)
              setOpen(true)
            }}
          >
            New journey
          </Button>
        }
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState title="No journeys" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Goal km</TableHead>
                <TableHead className="text-right">Starters</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((j) => (
                <TableRow
                  key={j.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/journeys/${j.id}`)}
                >
                  <TableCell>
                    <p className="font-medium">{j.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {j.description}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{j.slug}</TableCell>
                  <TableCell className="text-right">
                    {Number(j.goalKm).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {j.starters ?? 0}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/journeys/${j.id}`}
                        className="inline-flex h-8 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
                      >
                        Open
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(j)
                          setForm({
                            slug: j.slug,
                            title: j.title,
                            description: j.description ?? "",
                            goalKm: Number(j.goalKm),
                            sortOrder: j.sortOrder ?? 1,
                            landmarks: JSON.stringify(
                              j.landmarks ?? [],
                              null,
                              2
                            ),
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
                          if (!confirm("Delete journey?")) return
                          try {
                            await api.del(`/admin/journeys/${j.id}`)
                            toast.success("Deleted")
                            await load()
                          } catch (e) {
                            toast.error(
                              e instanceof Error ? e.message : "Failed"
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
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit journey" : "New journey"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {!editing ? (
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
            ) : null}
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
                <Label>Goal km</Label>
                <Input
                  type="number"
                  value={form.goalKm}
                  onChange={(e) =>
                    setForm({ ...form, goalKm: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sort</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Landmarks JSON</Label>
              <Textarea
                rows={5}
                className="font-mono text-xs"
                value={form.landmarks}
                onChange={(e) =>
                  setForm({ ...form, landmarks: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={busy || !form.title}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
