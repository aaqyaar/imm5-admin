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
import { api, type AdminTeam } from "@/lib/api"

type Member = {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: string
  joinedAt?: string
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [team, setTeam] = useState<AdminTeam | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, mem] = await Promise.all([
        api.get<{ items: AdminTeam[] }>("/admin/teams?limit=100&offset=0"),
        api.get<Member[]>(`/admin/teams/${id}/members`),
      ])
      const found = (list.items ?? []).find((t) => t.id === id) ?? null
      setTeam(found)
      setMembers(mem ?? [])
      if (!found) toast.error("Team not found")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load team")
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

  if (!team) {
    return (
      <EmptyState
        title="Team not found"
        description="It may have been deleted."
      />
    )
  }

  return (
    <DetailShell
      backHref="/teams"
      backLabel="Teams"
      title={team.name}
      subtitle={team.description || "No description"}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Teams", href: "/teams" },
        { label: team.name },
      ]}
      badges={
        <>
          <Badge variant="secondary" className="capitalize">
            {team.kind.replace(/_/g, " ")}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {team.visibility}
          </Badge>
        </>
      }
      actions={
        <Link
          href="/teams"
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          Back to list
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Members"
          value={String(team.memberCount ?? members.length)}
        />
        <StatTile
          label="Goal steps"
          value={Number(team.goalSteps).toLocaleString()}
        />
        <StatTile
          label="Owner"
          value={
            team.ownerFirstName
              ? `${team.ownerFirstName} ${team.ownerLastName ?? ""}`.trim()
              : "—"
          }
        />
      </div>

      <SectionTabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "members", label: "Members", count: members.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Panel title="Record" description="Full team configuration">
          <FieldGrid cols={3}>
            <Field label="Name" value={team.name} />
            <Field label="Kind" value={team.kind} />
            <Field label="Visibility" value={team.visibility} />
            <Field
              label="Goal steps"
              value={Number(team.goalSteps).toLocaleString()}
            />
            <Field
              label="Member count"
              value={String(team.memberCount ?? members.length)}
            />
            <Field
              label="Created"
              value={
                team.createdAt ? new Date(team.createdAt).toLocaleString() : "—"
              }
            />
            <Field
              label="Description"
              value={team.description || "—"}
              className="sm:col-span-3"
            />
          </FieldGrid>
        </Panel>
      ) : (
        <Panel title="Members" description="Everyone currently in this team">
          {members.length === 0 ? (
            <EmptyState title="No members" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.userId || m.email}>
                    <TableCell className="font-medium">
                      {m.firstName} {m.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {m.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.joinedAt
                        ? new Date(m.joinedAt).toLocaleDateString()
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
