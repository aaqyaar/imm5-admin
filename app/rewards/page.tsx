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
import { api, type AdminReward } from "@/lib/api"

type Redemption = {
  id: string
  firstName: string
  lastName: string
  email: string
  title: string
  costXp: number
  redeemedAt: string
}

const EMPTY = { code: "", title: "", description: "", costXp: 50, active: true }

export default function RewardsPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminReward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminReward | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rewards, reds] = await Promise.all([
        api.get<AdminReward[]>("/admin/rewards"),
        api.get<Redemption[]>("/admin/rewards/redemptions?limit=30"),
      ])
      setItems(rewards ?? [])
      setRedemptions(reds ?? [])
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
        await api.put(`/admin/rewards/${editing.id}`, form)
        toast.success("Reward updated")
      } else {
        await api.post("/admin/rewards", form)
        toast.success("Reward created")
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
    <div className="space-y-8">
      <PageHeader
        title="Rewards"
        description="XP catalog. Open a reward for redemptions and full record."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Rewards" }]}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setForm(EMPTY)
              setOpen(true)
            }}
          >
            New reward
          </Button>
        }
      />
      <Panel title="Catalog">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState title="No rewards" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/rewards/${r.id}`)}
                >
                  <TableCell>
                    <p className="font-medium">{r.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.code}</TableCell>
                  <TableCell className="text-right">{r.costXp}</TableCell>
                  <TableCell>
                    <Badge variant={r.active ? "default" : "secondary"}>
                      {r.active ? "active" : "inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/rewards/${r.id}`}
                        className="inline-flex h-8 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
                      >
                        Open
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(r)
                          setForm({
                            code: r.code,
                            title: r.title,
                            description: r.description ?? "",
                            costXp: r.costXp,
                            active: r.active,
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
                          if (!confirm("Delete reward?")) return
                          try {
                            await api.del(`/admin/rewards/${r.id}`)
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

      <Panel title="Recent redemptions">
        {redemptions.length === 0 ? (
          <EmptyState title="No redemptions yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead className="text-right">XP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {redemptions.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.firstName} {r.lastName}
                  </TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell className="text-right">{r.costXp}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.redeemedAt
                      ? new Date(r.redeemedAt).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit reward" : "New reward"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {!editing ? (
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
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
                <Label>Cost XP</Label>
                <Input
                  type="number"
                  value={form.costXp}
                  onChange={(e) =>
                    setForm({ ...form, costXp: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <select
                  className="h-9 w-full rounded-xl border border-input px-3 text-sm"
                  value={form.active ? "yes" : "no"}
                  onChange={(e) =>
                    setForm({ ...form, active: e.target.value === "yes" })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
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
