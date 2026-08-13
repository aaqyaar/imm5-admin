"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState, PageHeader, Panel } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api, type AcademyCourse } from "@/lib/api"

export default function AcademyPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<AcademyCourse[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCourses(
        (await api.get<AcademyCourse[]>("/admin/academy/courses")) ?? []
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load courses")
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
        title="Academy"
        description="Fixed catalog of 10 metabolic courses. Open a course for the full lesson/video picture."
        breadcrumbs={[{ label: "Modules", href: "/" }, { label: "Academy" }]}
      />
      <Panel
        title="Courses"
        description="Titles are locked — manage lessons and covers inside each course"
      >
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading…
          </p>
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses"
            description="Run the API seed to create the 10 courses."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c, i) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/academy/${c.id}`)}
                >
                  <TableCell className="text-muted-foreground">
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{c.title}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {c.summary}
                    </p>
                  </TableCell>
                  <TableCell>{c.level}</TableCell>
                  <TableCell className="text-right">{c.lessonCount}</TableCell>
                  <TableCell>
                    <Badge variant={c.published ? "default" : "secondary"}>
                      {c.published ? "published" : "hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/academy/${c.id}`}
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
    </div>
  )
}
