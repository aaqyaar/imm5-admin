"use client"

import { useParams, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { toast } from "sonner"

import { DetailShell, EmptyState } from "@/components/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, type AcademyCourse } from "@/lib/api"

export default function NewAcademyLessonPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<AcademyCourse | null>(null)
  const [loading, setLoading] = useState(true)
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
      const courses = await api.get<AcademyCourse[]>("/admin/academy/courses")
      const found = (courses ?? []).find((c) => c.id === id) ?? null
      setCourse(found)
      if (found) {
        setForm((f) => ({ ...f, sortOrder: (found.lessonCount ?? 0) + 1 }))
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
      const lesson = await api.post<{ id: string }>(
        `/admin/academy/courses/${id}/lessons`,
        form
      )
      toast.success("Lesson created")
      router.push(`/academy/${id}/lessons/${lesson.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create lesson")
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
      title="New lesson"
      subtitle={`Add a video lesson to ${course.title}`}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Academy", href: "/academy" },
        { label: course.title, href: `/academy/${id}` },
        { label: "New lesson" },
      ]}
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/academy/${id}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={busy || !form.title || !form.videoUrl}
          >
            {busy ? "Saving…" : "Create lesson"}
          </Button>
        </>
      }
    >
      <LessonForm form={form} setForm={setForm} />
    </DetailShell>
  )
}

function LessonForm({
  form,
  setForm,
}: {
  form: {
    title: string
    description: string
    sortOrder: number
    videoUrl: string
    thumbnailUrl: string
    durationSeconds: number
    published: boolean
  }
  setForm: Dispatch<
    SetStateAction<{
      title: string
      description: string
      sortOrder: number
      videoUrl: string
      thumbnailUrl: string
      durationSeconds: number
      published: boolean
    }>
  >
}) {
  return (
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
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Video URL</Label>
        <Input
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          placeholder="https://…/lesson.mp4"
        />
      </div>
      <div className="space-y-2">
        <Label>Thumbnail URL</Label>
        <Input
          value={form.thumbnailUrl}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Duration (sec)</Label>
          <Input
            type="number"
            value={form.durationSeconds}
            onChange={(e) =>
              setForm({ ...form, durationSeconds: Number(e.target.value) || 0 })
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
  )
}
