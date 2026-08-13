export const DIAGNOSIS_LABELS: Record<string, string> = {
  prediabetes: "Prediabetes",
  t2dm: "Type 2 Diabetes",
  obesity: "Obesity",
  pcos: "PCOS",
  fatty_liver: "Fatty Liver",
  hypertension: "Hypertension",
  high_cholesterol: "High cholesterol",
  sleep_apnea: "Sleep apnea",
  metabolic_syndrome: "Metabolic Syndrome",
}

export const NUTRITION_TYPE_LABELS: Record<string, string> = {
  low_carb: "Low carbohydrate",
  mediterranean: "Mediterranean",
  low_gi: "Low glycaemic",
  calorie_deficit: "Calorie-aware",
  dash: "DASH-style",
  balanced: "Balanced metabolic",
}

export const NUTRITION_TYPES = [
  "low_carb",
  "mediterranean",
  "low_gi",
  "calorie_deficit",
  "dash",
  "balanced",
] as const

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  very_active: "Very active",
}

export const STRESS_LABELS: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  very_high: "Very high",
}

export const SMOKING_LABELS: Record<string, string> = {
  never: "Never",
  former: "Former",
  occasional: "Occasional",
  daily: "Daily",
}

export const ALCOHOL_LABELS: Record<string, string> = {
  none: "None",
  occasional: "Occasional",
  moderate: "Moderate",
  heavy: "Heavy",
}

export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  so: "Somali",
  ar: "Arabic",
  sv: "Swedish",
}

export const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  weight: { label: "Weight", unit: "kg" },
  waist: { label: "Waist", unit: "cm" },
  body_fat_pct: { label: "Body fat", unit: "%" },
  muscle_pct: { label: "Muscle", unit: "%" },
  body_water_pct: { label: "Body water", unit: "%" },
  hba1c: { label: "HbA1c", unit: "%" },
  glucose_fasting: { label: "Fasting glucose", unit: "mmol/L" },
  bp_systolic: { label: "Systolic BP", unit: "mmHg" },
  bp_diastolic: { label: "Diastolic BP", unit: "mmHg" },
  pulse: { label: "Pulse", unit: "bpm" },
  hdl: { label: "HDL", unit: "mmol/L" },
  ldl: { label: "LDL", unit: "mmol/L" },
  triglycerides: { label: "Triglycerides", unit: "mmol/L" },
  total_cholesterol: { label: "Total cholesterol", unit: "mmol/L" },
  alt: { label: "ALT", unit: "U/L" },
  ast: { label: "AST", unit: "U/L" },
  ggt: { label: "GGT", unit: "U/L" },
  insulin_fasting: { label: "Fasting insulin", unit: "µU/mL" },
  homa_ir: { label: "HOMA-IR", unit: "" },
}

export function labelFor(
  map: Record<string, string>,
  value?: string | null
): string {
  if (!value?.trim()) return "—"
  return map[value] ?? value.replace(/_/g, " ")
}

export function formatGender(gender?: string | null): string {
  if (!gender?.trim()) return "—"
  if (gender === "female") return "Female"
  if (gender === "male") return "Male"
  return gender
}

export function formatDob(iso?: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function computeBmi(
  heightCm?: number | null,
  weightKg?: number | null
): string {
  if (heightCm == null || weightKg == null || heightCm <= 0) return "—"
  const h = heightCm / 100
  return (weightKg / (h * h)).toFixed(1)
}

export function formatRegion(
  city?: string | null,
  country?: string | null
): string {
  const parts = [city?.trim(), country?.trim()].filter(Boolean)
  return parts.length ? parts.join(", ") : "—"
}
