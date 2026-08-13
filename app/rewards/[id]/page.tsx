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
import { api, type AdminReward } from "@/lib/api"

type Redemption = {
  id: string
  rewardId: string
  firstName: string
  lastName: string
  email: string
  title: string
  costXp: number
  redeemedAt: string
}

export default function RewardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [reward, setReward] = useState<AdminReward | null>(null)
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catalog, reds] = await Promise.all([
        api.get<AdminReward[]>("/admin/rewards"),
        api.get<Redemption[]>("/admin/rewards/redemptions?limit=100"),
      ])
      setReward((catalog ?? []).find((r) => r.id === id) ?? null)
      setRedemptions((reds ?? []).filter((r) => r.rewardId === id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load reward")
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

  if (!reward) return <EmptyState title="Reward not found" />

  return (
    <DetailShell
      backHref="/rewards"
      backLabel="Rewards"
      title={reward.title}
      subtitle={reward.description || undefined}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Rewards", href: "/rewards" },
        { label: reward.title },
      ]}
      badges={
        <>
          <Badge variant="secondary" className="font-mono">
            {reward.code}
          </Badge>
          <Badge variant={reward.active ? "default" : "outline"}>
            {reward.active ? "active" : "inactive"}
          </Badge>
        </>
      }
      actions={
        <Link
          href="/rewards"
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          Back to list
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Cost" value={`${reward.costXp} XP`} />
        <StatTile label="Redemptions" value={String(redemptions.length)} />
        <StatTile
          label="Status"
          value={reward.active ? "Active" : "Inactive"}
        />
      </div>

      <SectionTabs
        tabs={[
          { id: "overview", label: "Overview" },
          {
            id: "redemptions",
            label: "Redemptions",
            count: redemptions.length,
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Panel title="Record">
          <FieldGrid cols={3}>
            <Field label="Title" value={reward.title} />
            <Field label="Code" value={reward.code} />
            <Field label="Cost XP" value={String(reward.costXp)} />
            <Field label="Active" value={reward.active ? "Yes" : "No"} />
            <Field
              label="Description"
              value={reward.description || "—"}
              className="sm:col-span-2"
            />
          </FieldGrid>
        </Panel>
      ) : (
        <Panel
          title="Who redeemed this"
          description="Recent redemptions for this catalog item"
        >
          {redemptions.length === 0 ? (
            <EmptyState title="No redemptions yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.email}
                    </TableCell>
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
      )}
    </DetailShell>
  )
}
