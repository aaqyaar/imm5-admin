"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { DashboardShell } from "@/components/dashboard-shell"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth"
import { isStaffRole } from "@/lib/api"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const isLogin = pathname === "/login"

  useEffect(() => {
    if (!ready) return
    if (!user || !isStaffRole(user.role)) {
      if (!isLogin) router.replace("/login")
      return
    }
    if (isLogin) router.replace("/")
  }, [ready, user, isLogin, router])

  if (!ready) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="w-64 space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (isLogin) return <>{children}</>

  if (!user || !isStaffRole(user.role)) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Skeleton className="h-8 w-40" />
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}
