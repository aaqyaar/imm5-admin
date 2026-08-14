"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PageHeader, Panel, StatTile } from "@/components/admin-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  api,
  type Assessment,
  type HealthMetric,
  type Medication,
  type PatientDetail,
  type Profile,
  type ProfileInput,
  type ProgramInput,
  type User,
} from "@/lib/api"
import { useAuth } from "@/lib/auth"
import {
  ACTIVITY_LABELS,
  ACTIVITY_OPTIONS,
  ALCOHOL_LABELS,
  ALCOHOL_OPTIONS,
  computeBmi,
  DIAGNOSIS_LABELS,
  formatDob,
  formatGender,
  formatRegion,
  labelFor,
  LANGUAGE_LABELS,
  METRIC_LABELS,
  NUTRITION_TYPE_LABELS,
  NUTRITION_TYPES,
  SLEEP_HOUR_OPTIONS,
  SMOKING_LABELS,
  SMOKING_OPTIONS,
  STRESS_LABELS,
  STRESS_OPTIONS,
} from "@/lib/patient-labels"

const ROLES = ["user", "support", "coach", "admin"] as const

const BODY_METRIC_TYPES = [
  "weight",
  "waist",
  "body_fat_pct",
  "muscle_pct",
  "body_water_pct",
] as const
const VITAL_METRIC_TYPES = [
  "hba1c",
  "glucose_fasting",
  "bp_systolic",
  "bp_diastolic",
  "pulse",
  "hdl",
  "ldl",
  "triglycerides",
  "total_cholesterol",
  "alt",
  "ast",
  "ggt",
  "insulin_fasting",
  "homa_ir",
] as const

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user: me } = useAuth()
  const [data, setData] = useState<PatientDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [role, setRole] = useState("user")
  const [nutritionType, setNutritionType] = useState("intensive_metabolic")
  const [dailySteps, setDailySteps] = useState("8000")
  const [sleepGoal, setSleepGoal] = useState("7")
  const [resistanceDays, setResistanceDays] = useState("2")
  const [stressGoal, setStressGoal] = useState("")
  const [clinicianNotes, setClinicianNotes] = useState("")
  const [activityLevel, setActivityLevel] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [stressLevel, setStressLevel] = useState("")
  const [smoking, setSmoking] = useState("")
  const [alcohol, setAlcohol] = useState("")
  const [occupation, setOccupation] = useState("")
  const [meds, setMeds] = useState<Medication[]>([])
  const [medName, setMedName] = useState("")
  const [medDose, setMedDose] = useState("")
  const [medSchedule, setMedSchedule] = useState("")
  const [medNotes, setMedNotes] = useState("")
  const [medBusy, setMedBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const d = await api.get<PatientDetail>(`/admin/users/${id}`)
      setData(d)
      setMeds(d.medications ?? [])
      setRole(d.user.role)
      setActivityLevel(d.profile?.activityLevel ?? "")
      setSleepHours(
        d.profile?.sleepHours != null ? String(d.profile.sleepHours) : ""
      )
      setStressLevel(d.profile?.stressLevel ?? "")
      setSmoking(d.profile?.smoking ?? "")
      setAlcohol(d.profile?.alcohol ?? "")
      setOccupation(d.profile?.occupation ?? "")
      if (d.program) {
        setNutritionType(d.program.nutritionType)
        setDailySteps(String(d.program.dailySteps))
        setSleepGoal(String(d.program.sleepGoal))
        setResistanceDays(String(d.program.resistanceDays))
        setStressGoal(d.program.stressGoal ?? "")
        setClinicianNotes(d.program.clinicianNotes ?? "")
      } else {
        setNutritionType(suggestNutritionType(d.profile?.diagnosis))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load patient")
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const metricsByType = useMemo(() => {
    const map: Record<string, HealthMetric> = {}
    for (const m of data?.latestMetrics ?? []) map[m.metricType] = m
    return map
  }, [data?.latestMetrics])

  async function setStatus(status: "active" | "suspended") {
    setBusy(true)
    try {
      const updated = await api.patch<User>(`/admin/users/${id}/status`, {
        status,
      })
      setData((prev) => (prev ? { ...prev, user: updated } : prev))
      toast.success(`Status set to ${status}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status")
    } finally {
      setBusy(false)
    }
  }

  async function saveRole() {
    setBusy(true)
    try {
      const updated = await api.patch<User>(`/admin/users/${id}/role`, { role })
      setData((prev) => (prev ? { ...prev, user: updated } : prev))
      toast.success("Role updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update role")
    } finally {
      setBusy(false)
    }
  }

  async function saveLifestyle() {
    setBusy(true)
    try {
      const body: ProfileInput = {
        activityLevel: activityLevel || undefined,
        stressLevel: stressLevel || undefined,
        smoking: smoking || undefined,
        alcohol: alcohol || undefined,
        occupation: occupation.trim() || undefined,
        sleepHours: sleepHours.trim() ? Number(sleepHours) : undefined,
      }
      const profile = await api.put<Profile>(`/admin/users/${id}/profile`, body)
      setData((prev) => (prev ? { ...prev, profile } : prev))
      toast.success("Lifestyle saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save lifestyle")
    } finally {
      setBusy(false)
    }
  }

  async function addMedication() {
    if (!medName.trim()) {
      toast.error("Medication name is required")
      return
    }
    setMedBusy(true)
    try {
      const created = await api.post<Medication>(`/admin/users/${id}/medications`, {
        name: medName.trim(),
        dose: medDose.trim(),
        schedule: medSchedule.trim(),
        notes: medNotes.trim(),
      })
      setMeds((prev) => [created, ...prev])
      setMedName("")
      setMedDose("")
      setMedSchedule("")
      setMedNotes("")
      toast.success("Medication added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add medication")
    } finally {
      setMedBusy(false)
    }
  }

  async function setMedicationActive(med: Medication, active: boolean) {
    setMedBusy(true)
    try {
      const updated = await api.patch<Medication>(
        `/admin/users/${id}/medications/${med.id}`,
        {
          name: med.name,
          dose: med.dose,
          schedule: med.schedule,
          notes: med.notes,
          active,
        }
      )
      setMeds((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
      toast.success(active ? "Medication activated" : "Medication stopped")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update medication")
    } finally {
      setMedBusy(false)
    }
  }

  async function removeMedication(med: Medication) {
    if (!window.confirm(`Remove ${med.name} from this patient?`)) return
    setMedBusy(true)
    try {
      await api.del(`/admin/users/${id}/medications/${med.id}`)
      setMeds((prev) => prev.filter((m) => m.id !== med.id))
      toast.success("Medication removed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove medication")
    } finally {
      setMedBusy(false)
    }
  }

  async function regenerateAiPlan() {
    setBusy(true)
    try {
      const updated = await api.post<PatientDetail["program"]>(
        `/admin/users/${id}/nutrition-plan/generate`
      )
      setData((prev) =>
        prev ? { ...prev, program: updated ?? prev.program } : prev
      )
      toast.success("AI nutrition plan regenerated")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not regenerate AI plan"
      )
    } finally {
      setBusy(false)
    }
  }

  async function saveNutritionPlan() {
    setBusy(true)
    try {
      const body: ProgramInput = {
        nutritionType,
        dailySteps: Number(dailySteps) || undefined,
        sleepGoal: Number(sleepGoal) || undefined,
        resistanceDays: Number(resistanceDays) || undefined,
        stressGoal: stressGoal.trim() || undefined,
        clinicianNotes: clinicianNotes.trim(),
      }
      const program = await api.put<PatientDetail["program"]>(
        `/admin/users/${id}/program`,
        body
      )
      setData((prev) =>
        prev ? { ...prev, program: program ?? undefined } : prev
      )
      toast.success("Nutrition plan assigned to patient")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save nutrition plan"
      )
    } finally {
      setBusy(false)
    }
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Patient" description={error} />
        <Link
          href="/patients"
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
        >
          Back to patients
        </Link>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const { user, profile, assessments = [] } = data
  const isAdmin = me?.role === "admin"

  return (
    <div>
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description={user.email}
        breadcrumbs={[
          { label: "Modules", href: "/" },
          { label: "Patients", href: "/patients" },
          { label: `${user.firstName} ${user.lastName}` },
        ]}
        actions={
          <Link
            href="/patients"
            className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm hover:bg-muted"
          >
            Back
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {user.role}
        </Badge>
        <Badge
          variant={user.status === "active" ? "default" : "outline"}
          className="capitalize"
        >
          {user.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Personal" description="Identity and app preferences">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Gender" value={formatGender(user.gender)} />
              <Field
                label="Date of birth"
                value={formatDob(user.dateOfBirth)}
              />
              <Field
                label="Language"
                value={labelFor(LANGUAGE_LABELS, profile?.language)}
              />
              <Field
                label="Region"
                value={formatRegion(profile?.city, profile?.country)}
              />
            </dl>
          </Panel>

          <Panel
            title="Body & composition"
            description="Profile snapshot and latest logged metrics"
          >
            <dl className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field
                label="Height"
                value={
                  profile?.heightCm != null ? `${profile.heightCm} cm` : "—"
                }
              />
              <Field
                label="Weight (profile)"
                value={
                  profile?.weightKg != null ? `${profile.weightKg} kg` : "—"
                }
              />
              <Field
                label="Target weight"
                value={
                  profile?.targetWeightKg != null
                    ? `${profile.targetWeightKg} kg`
                    : "—"
                }
              />
              <Field
                label="Waist (profile)"
                value={profile?.waistCm != null ? `${profile.waistCm} cm` : "—"}
              />
              <Field
                label="BMI"
                value={computeBmi(profile?.heightCm, profile?.weightKg)}
                hint="From profile height & weight"
              />
            </dl>
            <MetricGrid
              types={[...BODY_METRIC_TYPES]}
              metricsByType={metricsByType}
            />
          </Panel>

          <Panel
            title="Latest vitals"
            description="Most recent logged readings"
          >
            <MetricGrid
              types={[...VITAL_METRIC_TYPES]}
              metricsByType={metricsByType}
            />
          </Panel>

          <Panel title="Medical focus">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Focus condition"
                value={labelFor(DIAGNOSIS_LABELS, profile?.diagnosis)}
              />
            </dl>
          </Panel>

          <Panel
            title="Medications"
            description="Doctor records patient medications here — not managed in the patient app"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="medName">Name</Label>
                  <Input
                    id="medName"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    placeholder="Metformin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medDose">Dose</Label>
                  <Input
                    id="medDose"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                    placeholder="500 mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medSchedule">Schedule</Label>
                  <Input
                    id="medSchedule"
                    value={medSchedule}
                    onChange={(e) => setMedSchedule(e.target.value)}
                    placeholder="Morning & evening"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medNotes">Notes</Label>
                  <Input
                    id="medNotes"
                    value={medNotes}
                    onChange={(e) => setMedNotes(e.target.value)}
                    placeholder="Optional clinical notes"
                  />
                </div>
              </div>
              <Button onClick={addMedication} disabled={medBusy || !medName.trim()}>
                {medBusy ? "Saving…" : "Add medication"}
              </Button>

              <div className="divide-y divide-border rounded-xl border border-border">
                {meds.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-muted-foreground">
                    No medications recorded yet.
                  </p>
                ) : (
                  meds.map((med) => (
                    <div
                      key={med.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{med.name}</p>
                          <Badge variant={med.active ? "default" : "secondary"}>
                            {med.active ? "Active" : "Stopped"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[med.dose, med.schedule].filter(Boolean).join(" · ") ||
                            "No dose / schedule"}
                        </p>
                        {med.notes ? (
                          <p className="text-xs text-muted-foreground">{med.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {med.active ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={medBusy}
                            onClick={() => setMedicationActive(med, false)}
                          >
                            Stop
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={medBusy}
                            onClick={() => setMedicationActive(med, true)}
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={medBusy}
                          onClick={() => removeMedication(med)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Panel>

          <Panel
            title="Lifestyle & habits"
            description="Doctor can set or update — patient can also edit in the app profile"
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="activityLevel">Activity level</Label>
                  <select
                    id="activityLevel"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                  >
                    <option value="">—</option>
                    {ACTIVITY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {labelFor(ACTIVITY_LABELS, v)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepHours">Sleep (h / night)</Label>
                  <select
                    id="sleepHours"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                  >
                    <option value="">—</option>
                    {SLEEP_HOUR_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v} h
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stressLevel">Stress</Label>
                  <select
                    id="stressLevel"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(e.target.value)}
                  >
                    <option value="">—</option>
                    {STRESS_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {labelFor(STRESS_LABELS, v)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smoking">Smoking</Label>
                  <select
                    id="smoking"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={smoking}
                    onChange={(e) => setSmoking(e.target.value)}
                  >
                    <option value="">—</option>
                    {SMOKING_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {labelFor(SMOKING_LABELS, v)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alcohol">Alcohol</Label>
                  <select
                    id="alcohol"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={alcohol}
                    onChange={(e) => setAlcohol(e.target.value)}
                  >
                    <option value="">—</option>
                    {ALCOHOL_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {labelFor(ALCOHOL_LABELS, v)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <input
                    id="occupation"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Office work"
                  />
                </div>
              </div>
              <Button onClick={saveLifestyle} disabled={busy}>
                Save lifestyle
              </Button>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel
            title="Nutrition plan"
            description="Doctor assigns the protocol. Intensive metabolic reset is the default for metabolic patients."
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    data.program?.source === "assigned"
                      ? "default"
                      : "secondary"
                  }
                >
                  {data.program?.source === "assigned"
                    ? "Clinician assigned"
                    : "Default / auto"}
                </Badge>
                {profile?.diagnosis ? (
                  <span className="text-xs text-muted-foreground">
                    Diagnosis: {labelFor(DIAGNOSIS_LABELS, profile.diagnosis)}
                  </span>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nutritionType">Protocol</Label>
                <select
                  id="nutritionType"
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={nutritionType}
                  onChange={(e) => setNutritionType(e.target.value)}
                >
                  {NUTRITION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {labelFor(NUTRITION_TYPE_LABELS, type)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Intensive metabolic reset = keto + weekly fasting (Phase 1).
                  Maintenance unlocks Phase 2 in the patient app (or when
                  weight / BMI / HbA1c targets are met).
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="dailySteps">Daily steps</Label>
                  <input
                    id="dailySteps"
                    type="number"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={dailySteps}
                    onChange={(e) => setDailySteps(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sleepGoal">Sleep (h)</Label>
                  <input
                    id="sleepGoal"
                    type="number"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={sleepGoal}
                    onChange={(e) => setSleepGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resistanceDays">Resistance days/wk</Label>
                  <input
                    id="resistanceDays"
                    type="number"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={resistanceDays}
                    onChange={(e) => setResistanceDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stressGoal">Stress goal</Label>
                <input
                  id="stressGoal"
                  className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={stressGoal}
                  onChange={(e) => setStressGoal(e.target.value)}
                  placeholder="Optional lifestyle guidance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinicianNotes">
                  Doctor preferences & notes
                </Label>
                <textarea
                  id="clinicianNotes"
                  className="min-h-[96px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="e.g. Avoid late dinners, prefer Somali low-carb plates, limit fruit to berries…"
                />
                <p className="text-xs text-muted-foreground">
                  Doctor preferences are sent to the AI when generating the full
                  meal plan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={saveNutritionPlan}>
                  Assign & generate AI plan
                </Button>
                {data.program ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={regenerateAiPlan}
                  >
                    Regenerate AI meals
                  </Button>
                ) : null}
              </div>

              {data.program?.planDetail ? (
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">
                    {data.program.planDetail.protocolTitle}
                  </p>
                  <p className="text-muted-foreground">
                    {data.program.planDetail.protocolSummary}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {data.program.planDetail.generatedBy === "llm"
                      ? "AI generated"
                      : "Fallback plan"}
                    {data.program.planGeneratedAt
                      ? ` · ${new Date(data.program.planGeneratedAt).toLocaleString()}`
                      : ""}
                  </p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {data.program.planDetail.meals.slice(0, 4).map((meal) => (
                      <li key={meal.mealType}>
                        {meal.mealType}: {meal.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Panel>

          <Panel title="Account actions">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || user.status === "active"}
                  onClick={() => setStatus("active")}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy || user.status === "suspended"}
                  onClick={() => setStatus("suspended")}
                >
                  Suspend
                </Button>
              </div>

              {isAdmin ? (
                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    className="h-9 w-full rounded-xl border border-input bg-background px-3 text-sm"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={busy || role === user.role}
                    onClick={saveRole}
                  >
                    Save role
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Only admins can change roles.
                </p>
              )}
            </div>
          </Panel>

          <Panel title="Steps">
            {data.stepsSummary ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <StatTile
                  label="Today"
                  value={Number(data.stepsSummary.stepsToday).toLocaleString()}
                />
                <StatTile
                  label="This week"
                  value={Number(data.stepsSummary.stepsWeek).toLocaleString()}
                  hint={`${Number(data.stepsSummary.distanceWeekKm).toFixed(1)} km`}
                />
                <StatTile
                  label="This month"
                  value={Number(data.stepsSummary.stepsMonth).toLocaleString()}
                />
                <StatTile
                  label="Personal best"
                  value={Number(
                    data.stepsSummary.personalBest
                  ).toLocaleString()}
                  hint={
                    data.stepsSummary.personalBestDate
                      ? data.stepsSummary.personalBestDate
                      : `${Number(data.stepsSummary.lifetimeDistanceKm).toFixed(1)} km lifetime`
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No step data yet.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Medical assessments">
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No assessments on file.
            </p>
          ) : (
            <div className="space-y-4">
              {assessments.map((item, i) => (
                <AssessmentRow key={item.id} item={item} latest={i === 0} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function MetricGrid({
  types,
  metricsByType,
}: {
  types: string[]
  metricsByType: Record<string, HealthMetric>
}) {
  const available = types.filter((t) => metricsByType[t])
  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No logged readings yet.</p>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {available.map((type) => {
        const m = metricsByType[type]
        const meta = METRIC_LABELS[type] ?? { label: type, unit: "" }
        const value = `${m.value}${meta.unit ? ` ${meta.unit}` : ""}`
        const when = new Date(m.recordedAt).toLocaleString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
        return (
          <StatTile
            key={type}
            label={meta.label}
            value={value}
            hint={`Logged ${when}`}
          />
        )
      })}
    </div>
  )
}

function formatAssessmentDate(iso?: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatRisk(risk?: string | null): string {
  if (!risk || risk === "unknown") return "Unknown"
  return risk.charAt(0).toUpperCase() + risk.slice(1)
}

function riskBadgeVariant(
  risk?: string | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (risk) {
    case "high":
      return "destructive"
    case "moderate":
      return "secondary"
    case "low":
      return "default"
    default:
      return "outline"
  }
}

function AssessmentRow({
  item,
  latest,
}: {
  item: Assessment
  latest?: boolean
}) {
  const bp =
    item.systolicBp != null || item.diastolicBp != null
      ? `${item.systolicBp ?? "—"}/${item.diastolicBp ?? "—"} mmHg`
      : "—"

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium">
          {formatAssessmentDate(item.createdAt)}
        </p>
        {latest ? <Badge variant="secondary">Latest</Badge> : null}
        <Badge
          variant={riskBadgeVariant(item.riskCategory)}
          className="capitalize"
        >
          {formatRisk(item.riskCategory)} risk
        </Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Metabolic score"
          value={String(item.metabolicScore ?? "—")}
        />
        <StatTile
          label="Readiness"
          value={String(item.readinessScore ?? "—")}
        />
        <StatTile
          label="HbA1c"
          value={item.hba1c != null ? `${item.hba1c}%` : "—"}
        />
        <StatTile label="Blood pressure" value={bp} />
      </div>
    </div>
  )
}

function suggestNutritionType(diagnosis?: string | null): string {
  if (diagnosis === "step_up") return "balanced"
  return "intensive_metabolic"
}

function Field({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground normal-case">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
