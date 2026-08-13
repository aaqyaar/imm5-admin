"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth"
import { MODULE_GROUPS, modulesForRole, moduleForPath } from "@/lib/modules"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const current = moduleForPath(pathname)
  const visibleModules = modulesForRole(user?.role)

  function onSignOut() {
    logout()
    router.replace("/login")
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 flex h-svh w-[15.5rem] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="border-b border-sidebar-border px-4 py-5">
          <Link href="/" className="block px-1">
            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              IMM5
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Operations</p>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
          {MODULE_GROUPS.map((group) => {
            const items = visibleModules.filter((m) => m.group === group.id)
            if (!items.length) return null
            return (
              <div key={group.id}>
                <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const active =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href ||
                          pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-md text-white",
                            item.tone,
                            !active && "opacity-90"
                          )}
                        >
                          <HugeiconsIcon
                            icon={item.icon}
                            size={15}
                            strokeWidth={2}
                          />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        <Separator />
        <div className="space-y-3 px-4 py-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
            <p className="mt-1 text-[11px] tracking-wide text-primary uppercase">
              {user?.role}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onSignOut}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border/80 bg-card/70 px-6 backdrop-blur-sm sm:px-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {current?.label ?? "IMM5"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {current?.description ?? "Metabolic care operations"}
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Dashboard
          </Link>
        </header>
        <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
