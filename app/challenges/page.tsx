"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  api,
  type Challenge,
  type ChallengeInput,
  type PagedChallenges,
} from "@/lib/api"

const EMPTY: ChallengeInput = {
  title: "",
  description: "",
  challengeType: "steps",
  goal: 70000,
  startDate: "",
  endDate: "",
}

function toDateInput(value: string | undefined) {
  if (!value) return ""
  return value.slice(0, 10)
}

export default function ChallengesPage() {
  const [items, setItems] = useState<Challenge[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Challenge | null>(null)
  const [form, setForm] = useState<ChallengeInput>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<PagedChallenges>(
        "/admin/challenges?limit=100&offset=0"
      )
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    const today = new Date()
    const end = new Date()
    end.setDate(end.getDate() + 14)
    setEditing(null)
    setForm({
      ...EMPTY,
      startDate: today.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    })
    setOpen(true)
  }

  function openEdit(ch: Challenge) {
    setEditing(ch)
    setForm({
      title: ch.title,
      description: ch.description ?? "",
      challengeType:
        (ch.challengeType as ChallengeInput["challengeType"]) || "steps",
      goal: Number(ch.goal),
      startDate: toDateInput(String(ch.startDate)),
      endDate: toDateInput(String(ch.endDate)),
    })
    setOpen(true)
  }

  async function onSave() {
    setBusy(true)
    try {
      if (editing) {
        await api.put(`/admin/challenges/${editing.id}`, form)
        toast.success("Challenge updated")
      } else {
        await api.post("/admin/challenges", form)
        toast.success("Challenge created")
      }
      setOpen(false)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!deleteId) return
    setBusy(true)
    try {
      await api.del(`/admin/challenges/${deleteId}`)
      toast.success("Challenge deleted")
      setDeleteId(null)
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Challenges"
        description="Walking challenges that power remission adherence."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Challenges" }]}
        actions={<Button onClick={openCreate}>New challenge</Button>}
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <Panel>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No challenges yet"
            description="Create a steps, walking-days, or distance challenge."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Goal</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((ch) => (
                  <TableRow key={ch.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ch.title}</p>
                        {ch.description ? (
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {ch.description}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {ch.challengeType.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(ch.goal).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {toDateInput(String(ch.startDate))} →{" "}
                      {toDateInput(String(ch.endDate))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(ch)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(ch.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">
              {total} challenges
            </p>
          </>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit challenge" : "New challenge"}
            </DialogTitle>
            <DialogDescription>
              Types: steps (total), walking days (≥5k/day), or distance (km).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={form.challengeType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      challengeType: e.target
                        .value as ChallengeInput["challengeType"],
                    })
                  }
                >
                  <option value="steps">Steps</option>
                  <option value="walking_days">Walking days</option>
                  <option value="distance">Distance (km)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Goal</Label>
                <Input
                  id="goal"
                  type="number"
                  min={1}
                  value={form.goal}
                  onChange={(e) =>
                    setForm({ ...form, goal: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input
                  id="start"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input
                  id="end"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={busy || !form.title || !form.startDate || !form.endDate}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete challenge?</DialogTitle>
            <DialogDescription>
              This removes the challenge for all participants. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={busy}>
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
