"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  DetailShell,
  EmptyState,
  Field,
  FieldGrid,
  Panel,
  StatTile,
} from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AcademyCourse, type AcademyLesson } from "@/lib/api"

export default function AcademyCourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<AcademyCourse | null>(null)
  const [lessons, setLessons] = useState<AcademyLesson[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [courses, lessonRows] = await Promise.all([
        api.get<AcademyCourse[]>("/admin/academy/courses"),
        api.get<AcademyLesson[]>(`/admin/academy/courses/${id}/lessons`),
      ])
      setCourse((courses ?? []).find((c) => c.id === id) ?? null)
      setLessons(lessonRows ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load course")
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

  if (!course) return <EmptyState title="Course not found" />

  const publishedLessons = lessons.filter((l) => l.published).length
  const totalMinutes = Math.round(
    lessons.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) / 60
  )

  return (
    <DetailShell
      backHref="/academy"
      backLabel="Academy"
      title={course.title}
      subtitle={course.summary || undefined}
      breadcrumbs={[
        { label: "Modules", href: "/" },
        { label: "Academy", href: "/academy" },
        { label: course.title },
      ]}
      badges={
        <>
          <Badge variant="secondary">{course.level}</Badge>
          <Badge variant="outline" className="font-mono">
            {course.slug}
          </Badge>
          <Badge variant={course.published ? "default" : "outline"}>
            {course.published ? "published" : "hidden"}
          </Badge>
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => router.push(`/academy/${id}/edit`)}
          >
            Edit course
          </Button>
          <Button onClick={() => router.push(`/academy/${id}/lessons/new`)}>
            Add lesson
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Lessons"
          value={String(lessons.length)}
          hint={`${publishedLessons} published`}
        />
        <StatTile label="Total length" value={`${totalMinutes} min`} />
        <StatTile label="Level" value={course.level} />
      </div>

      <Panel title="Course record">
        <FieldGrid cols={3}>
          <Field label="Title" value={course.title} />
          <Field label="Slug" value={course.slug} />
          <Field label="Level" value={course.level} />
          <Field label="Published" value={course.published ? "Yes" : "No"} />
          <Field
            label="Cover URL"
            value={course.coverImageUrl || "—"}
            className="sm:col-span-2"
          />
          <Field
            label="Summary"
            value={course.summary || "—"}
            className="sm:col-span-3"
          />
        </FieldGrid>
        {course.coverImageUrl ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-border/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.coverImageUrl}
              alt=""
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Lessons"
        description="Open a lesson to view or edit video content"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/academy/${id}/lessons/new`)}
          >
            New lesson
          </Button>
        }
      >
        {lessons.length === 0 ? (
          <EmptyState
            title="No lessons yet"
            description="Create a lesson page with a hosted video URL."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((l, i) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/academy/${id}/lessons/${l.id}`)}
                >
                  <TableCell className="text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{l.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {l.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    {Math.round((l.durationSeconds || 0) / 60)} min
                  </TableCell>
                  <TableCell>
                    <Badge variant={l.published ? "default" : "secondary"}>
                      {l.published ? "live" : "draft"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/academy/${id}/lessons/${l.id}`}
                      className="inline-flex h-8 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </DetailShell>
  )
}
