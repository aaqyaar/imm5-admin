"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AdminFeedPost } from "@/lib/api"

export default function FeedPage() {
  const [items, setItems] = useState<AdminFeedPost[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<{ items: AdminFeedPost[]; total: number }>(
        "/admin/feed?limit=100&offset=0"
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

  return (
    <div>
      <PageHeader
        title="Feed"
        description="Moderate community posts — delete inappropriate content."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Feed" }]}
      />
      <Panel>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState title="No posts" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Author</TableHead>
                  <TableHead>Post</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-medium">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="line-clamp-2 text-sm">{p.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.createdAt
                          ? new Date(p.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.kind}</Badge>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.visibility}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(p.likeCount ?? 0)} likes ·{" "}
                      {Number(p.commentCount ?? 0)} comments
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (!confirm("Delete this post?")) return
                          try {
                            await api.del(`/admin/feed/${p.id}`)
                            toast.success("Post deleted")
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-muted-foreground">{total} posts</p>
          </>
        )}
      </Panel>
    </div>
  )
}
