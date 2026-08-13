"use client"

import Link from "next/link"
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
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"

export type AdminAppointment = {
  id: string
  userId: string
  title: string
  mode: string
  status: string
  startsAt: string
  endsAt: string | null
  notes: string
  clinicianId: string | null
  patientFirstName: string
  patientLastName: string
  patientEmail: string
  clinicianFirstName: string
  clinicianLastName: string
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<AdminAppointment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<{ items: AdminAppointment[] }>(
        "/admin/appointments?limit=100"
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

  async function accept(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await api.post(`/admin/appointments/${id}/accept`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not accept")
    } finally {
      setBusyId(null)
    }
  }

  const mine = user?.id

  return (
    <div>
      <PageHeader
        title="Appointments"
        description="Accept a video or phone visit to become the assigned clinician, then join the call in the browser."
        breadcrumbs={[
          { label: "Modules", href: "/" },
          { label: "Appointments" },
        ]}
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <Panel title="Upcoming & recent">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            title="No appointments"
            description="Patients book from the app under Profile → Appointments."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clinician</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => {
                const isRemote = a.mode === "video" || a.mode === "phone"
                const isMine = !!mine && a.clinicianId === mine
                const unassigned = !a.clinicianId
                const canAccept =
                  isRemote && a.status === "upcoming" && (unassigned || isMine)
                const canJoin = isRemote && a.status === "upcoming" && isMine
                return (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(a.startsAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">
                        {a.patientFirstName} {a.patientLastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {a.patientEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{a.title}</TableCell>
                    <TableCell className="capitalize text-sm">{a.mode}</TableCell>
                    <TableCell className="capitalize text-sm">{a.status}</TableCell>
                    <TableCell className="text-sm">
                      {a.clinicianId
                        ? `${a.clinicianFirstName} ${a.clinicianLastName}`.trim() ||
                          "Assigned"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canAccept && !isMine ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === a.id}
                            onClick={() => accept(a.id)}
                          >
                            Accept
                          </Button>
                        ) : null}
                        {canJoin ? (
                          <Button size="sm" asChild>
                            <Link href={`/appointments/call/${a.id}`}>
                              Join call
                            </Link>
                          </Button>
                        ) : null}
                        {canAccept && isMine && !canJoin ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === a.id}
                            onClick={() => accept(a.id)}
                          >
                            Accepted
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
