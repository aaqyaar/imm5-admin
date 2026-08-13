"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { PageHeader, Panel } from "@/components/admin-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth"

type ICEProvider = "cloudflare" | "static" | "janus"

type ICESettingsResponse = {
  provider: ICEProvider
  stunUrls: string
  turnUrls: string
  turnUsername: string
  turnCredential: string
  turnCredentialSet: boolean
  turnSecret: string
  turnSecretSet: boolean
  turnTtlSeconds: number
  cloudflareTurnKeyId: string
  cloudflareTurnApiToken: string
  cloudflareConfigured: boolean
  janusHttpUrl: string
  janusWsUrl: string
  janusStunUrls: string
  janusTurnUrls: string
  janusTurnUsername: string
  janusTurnCredential: string
  janusCredentialSet: boolean
  providers: ICEProvider[]
  previewIceServers?: unknown[]
}

const PROVIDERS: {
  id: ICEProvider
  title: string
  blurb: string
}[] = [
  {
    id: "janus",
    title: "Janus",
    blurb: "Janus Gateway URLs + example global STUN/TURN (Meetecho / Open Relay).",
  },
  {
    id: "static",
    title: "Static TURN / STUN",
    blurb: "Your own coturn or static credentials from env / form.",
  },
  {
    id: "cloudflare",
    title: "Cloudflare",
    blurb: "Cloudflare Realtime TURN — fresh credentials via API each join.",
  },
]

export default function CallICESettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<ICESettingsResponse | null>(null)
  const [form, setForm] = useState<Partial<ICESettingsResponse>>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/")
    }
  }, [user, router])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ICESettingsResponse>("/admin/settings/ice")
      setData(res)
      setForm(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ICE settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const set = (key: keyof ICESettingsResponse, value: string | number) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(null)
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(null)
    try {
      const body = {
        provider: form.provider,
        stunUrls: form.stunUrls ?? "",
        turnUrls: form.turnUrls ?? "",
        turnUsername: form.turnUsername ?? "",
        turnCredential:
          form.turnCredential && !String(form.turnCredential).startsWith("••••")
            ? form.turnCredential
            : "",
        turnSecret:
          form.turnSecret && !String(form.turnSecret).startsWith("••••")
            ? form.turnSecret
            : "",
        turnTtlSeconds: Number(form.turnTtlSeconds) || 86400,
        cloudflareTurnKeyId: form.cloudflareTurnKeyId ?? "",
        cloudflareTurnApiToken:
          form.cloudflareTurnApiToken &&
          !String(form.cloudflareTurnApiToken).startsWith("••••")
            ? form.cloudflareTurnApiToken
            : "",
        janusHttpUrl: form.janusHttpUrl ?? "",
        janusWsUrl: form.janusWsUrl ?? "",
        janusStunUrls: form.janusStunUrls ?? "",
        janusTurnUrls: form.janusTurnUrls ?? "",
        janusTurnUsername: form.janusTurnUsername ?? "",
        janusTurnCredential:
          form.janusTurnCredential &&
          !String(form.janusTurnCredential).startsWith("••••")
            ? form.janusTurnCredential
            : "",
      }
      const res = await api.put<ICESettingsResponse>("/admin/settings/ice", body)
      setData(res)
      setForm(res)
      setSaved(`Saved — active provider: ${res.provider}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const applyJanusDefaults = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await api.post<ICESettingsResponse>(
        "/admin/settings/ice/janus-defaults",
        {}
      )
      setData(res)
      setForm(res)
      setSaved("Applied Janus example / global credentials")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply Janus defaults")
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6">
        <PageHeader title="Call ICE settings" description="Loading…" />
      </div>
    )
  }

  const provider = (form.provider ?? "static") as ICEProvider

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Call ICE settings"
        description="Choose how video calls get STUN/TURN: Janus (example global), your static TURN, or Cloudflare Realtime."
      />

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {saved}
        </p>
      ) : null}

      <Panel title="Provider">
        <div className="grid gap-3 md:grid-cols-3">
          {PROVIDERS.map((p) => {
            const active = provider === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => set("provider", p.id)}
                className={`rounded-xl border px-4 py-4 text-left transition ${
                  active
                    ? "border-[#2F6F64] bg-[#2F6F64]/10 ring-2 ring-[#2F6F64]/30"
                    : "border-border bg-background hover:border-[#2F6F64]/40"
                }`}
              >
                <div className="text-sm font-semibold">{p.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{p.blurb}</p>
                {p.id === "cloudflare" && data?.cloudflareConfigured ? (
                  <p className="mt-2 text-xs text-emerald-700">API keys configured</p>
                ) : null}
              </button>
            )
          })}
        </div>
      </Panel>

      {provider === "janus" ? (
        <Panel title="Janus + example global ICE">
          <div className="mb-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void applyJanusDefaults()}>
              Load example global creds
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Janus HTTP URL"
              value={form.janusHttpUrl ?? ""}
              onChange={(v) => set("janusHttpUrl", v)}
            />
            <Field
              label="Janus WebSocket URL"
              value={form.janusWsUrl ?? ""}
              onChange={(v) => set("janusWsUrl", v)}
            />
            <Field
              label="Janus STUN URLs"
              value={form.janusStunUrls ?? ""}
              onChange={(v) => set("janusStunUrls", v)}
              className="md:col-span-2"
            />
            <Field
              label="Janus TURN URLs"
              value={form.janusTurnUrls ?? ""}
              onChange={(v) => set("janusTurnUrls", v)}
              className="md:col-span-2"
            />
            <Field
              label="TURN username"
              value={form.janusTurnUsername ?? ""}
              onChange={(v) => set("janusTurnUsername", v)}
            />
            <Field
              label="TURN credential"
              value={form.janusTurnCredential ?? ""}
              onChange={(v) => set("janusTurnCredential", v)}
              placeholder={data?.janusCredentialSet ? "•••••••• (leave to keep)" : ""}
              type="password"
            />
          </div>
        </Panel>
      ) : null}

      {provider === "static" ? (
        <Panel title="Static STUN / TURN">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="STUN URLs"
              value={form.stunUrls ?? ""}
              onChange={(v) => set("stunUrls", v)}
              className="md:col-span-2"
            />
            <Field
              label="TURN URLs"
              value={form.turnUrls ?? ""}
              onChange={(v) => set("turnUrls", v)}
              className="md:col-span-2"
            />
            <Field
              label="TURN username (static)"
              value={form.turnUsername ?? ""}
              onChange={(v) => set("turnUsername", v)}
            />
            <Field
              label="TURN credential"
              value={form.turnCredential ?? ""}
              onChange={(v) => set("turnCredential", v)}
              type="password"
              placeholder={data?.turnCredentialSet ? "•••••••• (leave to keep)" : ""}
            />
            <Field
              label="TURN REST secret (coturn)"
              value={form.turnSecret ?? ""}
              onChange={(v) => set("turnSecret", v)}
              type="password"
              placeholder={data?.turnSecretSet ? "•••••••• (leave to keep)" : ""}
            />
            <Field
              label="Credential TTL (seconds)"
              value={String(form.turnTtlSeconds ?? 86400)}
              onChange={(v) => set("turnTtlSeconds", Number(v) || 86400)}
            />
          </div>
        </Panel>
      ) : null}

      {provider === "cloudflare" ? (
        <Panel title="Cloudflare Realtime TURN">
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="TURN Key ID"
              value={form.cloudflareTurnKeyId ?? ""}
              onChange={(v) => set("cloudflareTurnKeyId", v)}
            />
            <Field
              label="API Token"
              value={form.cloudflareTurnApiToken ?? ""}
              onChange={(v) => set("cloudflareTurnApiToken", v)}
              type="password"
              placeholder={
                data?.cloudflareConfigured ? "•••••••• (leave to keep)" : ""
              }
            />
            <Field
              label="Credential TTL (seconds)"
              value={String(form.turnTtlSeconds ?? 86400)}
              onChange={(v) => set("turnTtlSeconds", Number(v) || 86400)}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Falls back to Static STUN if the Cloudflare API call fails.
          </p>
        </Panel>
      ) : null}

      <div className="flex gap-3">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save ICE settings"}
        </Button>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={saving}>
          Reload
        </Button>
      </div>

      {data?.previewIceServers ? (
        <Panel title="Preview iceServers (next join)">
          <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs">
            {JSON.stringify(data.previewIceServers, null, 2)}
          </pre>
        </Panel>
      ) : null}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  className,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
  type?: string
  placeholder?: string
}) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="mt-1"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
