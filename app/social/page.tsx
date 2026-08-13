"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel, StatTile } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type SocialOverview } from "@/lib/api"

export default function SocialPage() {
  const [data, setData] = useState<SocialOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<SocialOverview>("/admin/social/overview"))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const pairs = data?.buddyPairs ?? []

  return (
    <div>
      <PageHeader
        title="Social"
        description="Friends and accountability buddy activity."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Social" }]}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Friend pairs"
          value={loading ? "—" : String(data?.friendPairs ?? 0)}
        />
        <StatTile
          label="Pending friend requests"
          value={loading ? "—" : String(data?.pendingFriendRequests ?? 0)}
        />
        <StatTile
          label="Active buddies"
          value={loading ? "—" : String(data?.activeBuddyPairs ?? 0)}
        />
        <StatTile
          label="Pending buddy requests"
          value={loading ? "—" : String(data?.pendingBuddyRequests ?? 0)}
        />
      </div>
      <Panel title="Buddy pairs">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : pairs.length === 0 ? (
          <EmptyState title="No buddy pairs yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person A</TableHead>
                <TableHead>Person B</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pairs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">
                      {p.aFirstName} {p.aLastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.aEmail}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {p.bFirstName} {p.bLastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.bEmail}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
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
