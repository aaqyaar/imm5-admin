import Link from "next/link"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
}) {
  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href?: string }[]
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span
            key={`${item.label}-${i}`}
            className="flex items-center gap-1.5"
          >
            {i > 0 ? <span className="text-border">/</span> : null}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span
                className={last ? "font-medium text-foreground" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 shadow-none",
        className
      )}
    >
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 font-heading text-3xl tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  )
}

export function Panel({
  children,
  className,
  title,
  action,
  description,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
  description?: string
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card p-5 shadow-none",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="font-heading text-lg tracking-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** Odoo-style app tile for the home launcher */
export function ModuleTile({
  href,
  label,
  description,
  icon,
  tone,
}: {
  href: string
  label: string
  description: string
  icon: IconSvgElement
  tone: string
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl text-white shadow-sm",
          tone
        )}
      >
        <HugeiconsIcon icon={icon} size={24} strokeWidth={1.8} />
      </div>
      <div>
        <p className="font-medium text-foreground group-hover:text-primary">
          {label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  )
}

export function Field({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value ?? "—"}</dd>
    </div>
  )
}

export function FieldGrid({
  children,
  cols = 2,
}: {
  children: React.ReactNode
  cols?: 2 | 3 | 4
}) {
  return (
    <dl
      className={cn(
        "grid gap-5",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "sm:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {children}
    </dl>
  )
}

/** Full-resource detail chrome: back + title strip + body */
export function DetailShell({
  backHref,
  backLabel = "Back",
  title,
  subtitle,
  badges,
  actions,
  breadcrumbs,
  children,
}: {
  backHref: string
  backLabel?: string
  title: string
  subtitle?: string
  badges?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null}
      <div className="rounded-2xl border border-border/80 bg-card">
        <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
              {backLabel}
            </Link>
            <div>
              <h1 className="font-heading text-2xl tracking-tight sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {badges ? (
              <div className="flex flex-wrap gap-2">{badges}</div>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
        <div className="space-y-6 p-5">{children}</div>
      </div>
    </div>
  )
}

export function SectionTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string; count?: number }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border/70 pb-px">
      {tabs.map((t) => {
        const on = t.id === active
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              "rounded-t-lg px-3 py-2 text-sm transition-colors",
              on
                ? "border border-b-0 border-border/80 bg-card font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.count != null ? (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({t.count})
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
