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
import { api, type AdminTeam } from "@/lib/api"

const EMPTY = {
  name: "",
  description: "",
  visibility: "public",
  kind: "general",
  goalSteps: 50000,
}

export default function TeamsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminTeam[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminTeam | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: AdminTeam[]; total: number }>(
        "/admin/teams?limit=100&offset=0"
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

  async function onSave() {
    setBusy(true)
    try {
      if (editing) {
        await api.put(`/admin/teams/${editing.id}`, form)
        toast.success("Team updated")
      } else {
        await api.post("/admin/teams", form)
        toast.success("Team created")
      }
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this team?")) return
    try {
      await api.del(`/admin/teams/${id}`)
      toast.success("Deleted")
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete")
    }
  }

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Family, workplace, and disease-specific walking groups. Open a team for the full record."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Teams" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setForm(EMPTY)
              setOpen(true)
            }}
          >
            New team
          </Button>
        }
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState title="No teams" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead className="text-right">Goal</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => router.push(`/teams/${t.id}`)}
                  >
                    <TableCell>
                      <p className="font-medium">{t.name}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.kind}</Badge>
                    </TableCell>
                    <TableCell>{t.visibility}</TableCell>
                    <TableCell className="text-right">
                      {t.memberCount}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(t.goalSteps).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/teams/${t.id}`}
                          className="inline-flex h-8 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
                        >
                          Open
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(t)
                            setForm({
                              name: t.name,
                              description: t.description ?? "",
                              visibility: t.visibility,
                              kind: t.kind,
                              goalSteps: t.goalSteps,
                            })
                            setOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(t.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">{total} teams</p>
          </>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit team" : "New team"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
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
                  {[
                    "general",
                    "family",
                    "workplace",
                    "diabetes",
                    "pcos",
                    "obesity",
                    "fatty_liver",
                    "hypertension",
                    "prediabetes",
                  ].map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <select
                  className="h-9 w-full rounded-xl border border-input px-3 text-sm"
                  value={form.visibility}
                  onChange={(e) =>
                    setForm({ ...form, visibility: e.target.value })
                  }
                >
                  <option value="public">public</option>
                  <option value="private">private</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Goal steps</Label>
              <Input
                type="number"
                value={form.goalSteps}
                onChange={(e) =>
                  setForm({ ...form, goalSteps: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onSave} disabled={busy || !form.name}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
