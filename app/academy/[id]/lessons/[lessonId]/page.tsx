"use client"

import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  DetailShell,
  EmptyState,
  Field,
  FieldGrid,
  Panel,
} from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, type AcademyCourse, type AcademyLesson } from "@/lib/api"

export default function AcademyLessonPage() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<AcademyCourse | null>(null)
  const [lesson, setLesson] = useState<AcademyLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    sortOrder: 1,
    videoUrl: "",
    thumbnailUrl: "",
    durationSeconds: 0,
    published: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [courses, lessons] = await Promise.all([
        api.get<AcademyCourse[]>("/admin/academy/courses"),
        api.get<AcademyLesson[]>(`/admin/academy/courses/${id}/lessons`),
      ])
      const c = (courses ?? []).find((x) => x.id === id) ?? null
      const l = (lessons ?? []).find((x) => x.id === lessonId) ?? null
      setCourse(c)
      setLesson(l)
      if (l) {
        setForm({
          title: l.title,
          description: l.description ?? "",
          sortOrder: l.sortOrder,
          videoUrl: l.videoUrl,
          thumbnailUrl: l.thumbnailUrl ?? "",
          durationSeconds: l.durationSeconds,
          published: l.published,
        })
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load lesson")
    } finally {
      setLoading(false)
    }
  }, [id, lessonId])

  useEffect(() => {
    load()
  }, [load])

  async function onSave() {
    setBusy(true)
    try {
      const updated = await api.put<AcademyLesson>(
        `/admin/academy/lessons/${lessonId}`,
        form
      )
      setLesson(updated)
      setEditing(false)
      toast.success("Lesson updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!confirm("Delete this lesson?")) return
    setBusy(true)
    try {
      await api.del(`/admin/academy/lessons/${lessonId}`)
      toast.success("Lesson deleted")
      router.push(`/academy/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete")
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

  if (!course || !lesson) return <EmptyState title="Lesson not found" />

  return (
    <DetailShell
      backHref={`/academy/${id}`}
      backLabel={course.title}
      title={editing ? "Edit lesson" : lesson.title}
      subtitle={course.title}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Academy", href: "/academy" },
        { label: course.title, href: `/academy/${id}` },
        { label: lesson.title },
      ]}
      badges={
        <>
          <Badge variant={lesson.published ? "default" : "secondary"}>
            {lesson.published ? "live" : "draft"}
          </Badge>
          <Badge variant="outline">
            {Math.round((lesson.durationSeconds || 0) / 60)} min
          </Badge>
        </>
      }
      actions={
        editing ? (
          <>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={busy || !form.title || !form.videoUrl}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="destructive" onClick={onDelete} disabled={busy}>
              Delete
            </Button>
            <Button onClick={() => setEditing(true)}>Edit</Button>
          </>
        )
      }
    >
      {editing ? (
        <div className="mx-auto max-w-xl space-y-4">
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
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Video URL</Label>
            <Input
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail URL</Label>
            <Input
              value={form.thumbnailUrl}
              onChange={(e) =>
                setForm({ ...form, thumbnailUrl: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Duration (sec)</Label>
              <Input
                type="number"
                value={form.durationSeconds}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationSeconds: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sort order</Label>
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
      ) : (
        <>
          <Panel title="Lesson record">
            <FieldGrid cols={2}>
              <Field label="Title" value={lesson.title} />
              <Field label="Sort order" value={String(lesson.sortOrder)} />
              <Field
                label="Duration"
                value={`${Math.round((lesson.durationSeconds || 0) / 60)} min (${lesson.durationSeconds}s)`}
              />
              <Field
                label="Published"
                value={lesson.published ? "Yes" : "No"}
              />
              <Field
                label="Description"
                value={lesson.description || "—"}
                className="sm:col-span-2"
              />
              <Field
                label="Video URL"
                value={lesson.videoUrl || "—"}
                className="sm:col-span-2"
              />
              <Field
                label="Thumbnail URL"
                value={lesson.thumbnailUrl || "—"}
                className="sm:col-span-2"
              />
            </FieldGrid>
          </Panel>

          {lesson.videoUrl ? (
            <Panel
              title="Video preview"
              description="Hosted URL — plays in the patient app"
            >
              <div className="overflow-hidden rounded-xl border border-border/70 bg-black">
                <video
                  key={lesson.videoUrl}
                  src={lesson.videoUrl}
                  controls
                  className="aspect-video w-full"
                  poster={lesson.thumbnailUrl || undefined}
                />
              </div>
              <a
                href={lesson.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-primary hover:underline"
              >
                Open video URL
              </a>
            </Panel>
          ) : null}
        </>
      )}
    </DetailShell>
  )
}
