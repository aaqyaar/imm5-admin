"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { DetailShell, EmptyState } from "@/components/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, type AcademyCourse } from "@/lib/api"

export default function EditAcademyCoursePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<AcademyCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    summary: "",
    level: "",
    coverImageUrl: "",
    published: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const courses = await api.get<AcademyCourse[]>("/admin/academy/courses")
      const found = (courses ?? []).find((c) => c.id === id) ?? null
      setCourse(found)
      if (found) {
        setForm({
          summary: found.summary ?? "",
          level: found.level,
          coverImageUrl: found.coverImageUrl ?? "",
          published: found.published,
        })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function onSave() {
    setBusy(true)
    try {
      await api.patch(`/admin/academy/courses/${id}`, form)
      toast.success("Course updated")
      router.push(`/academy/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!course) return <EmptyState title="Course not found" />

  return (
    <DetailShell
      backHref={`/academy/${id}`}
      backLabel={course.title}
      title="Edit course"
      subtitle="Title and slug are fixed. Update summary, cover, and visibility."
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Academy", href: "/academy" },
        { label: course.title, href: `/academy/${id}` },
        { label: "Edit" },
      ]}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/academy/${id}`)}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="mx-auto max-w-xl space-y-4">
        <div className="space-y-2">
          <Label>Title (locked)</Label>
          <Input value={course.title} disabled />
        </div>
        <div className="space-y-2">
          <Label>Slug (locked)</Label>
          <Input value={course.slug} disabled className="font-mono" />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea
            rows={4}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Level</Label>
          <Input
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Cover image URL</Label>
          <Input
            value={form.coverImageUrl}
            onChange={(e) =>
              setForm({ ...form, coverImageUrl: e.target.value })
            }
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label>Published</Label>
          <select
            className="h-9 w-full rounded-xl border border-input px-3 text-sm"
            value={form.published ? "yes" : "no"}
            onChange={(e) =>
              setForm({ ...form, published: e.target.value === "yes" })
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>
    </DetailShell>
  )
}
