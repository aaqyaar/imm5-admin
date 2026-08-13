export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1"

export const STAFF_ROLES = ["admin", "coach", "support"] as const
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(role: string): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role)
}

export type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string | null
  role: string
  status: string
  createdAt: string
}

export type Profile = {
  userId: string
  heightCm: number | null
  weightKg: number | null
  waistCm: number | null
  targetWeightKg: number | null
  diagnosis: string
  activityLevel: string
  country: string
  city: string
  language: string
  smoking: string
  alcohol: string
  occupation: string
  stressLevel: string
  sleepHours: number | null
}

export type HealthMetric = {
  id: string
  metricType: string
  value: number
  recordedAt: string
  note?: string
}

export type Assessment = {
  id: string
  userId: string
  hba1c?: number | null
  systolicBp?: number | null
  diastolicBp?: number | null
  metabolicScore?: number | null
  readinessScore?: number | null
  riskCategory?: string | null
  createdAt?: string
}

export type AdminStats = {
  totalUsers: number
  activeUsers7d: number
  totalChallenges: number
  avgStepsLast7d: number
  avgWeightChangeKg: number
}

export type UserGrowthRow = {
  day: string
  count: number
}

export type ChallengeParticipationRow = {
  id: string
  title: string
  participants: number
  completed: number
}

export type Challenge = {
  id: string
  title: string
  description: string
  challengeType: string
  goal: number
  startDate: string
  endDate: string
  createdAt?: string
}

export type ChallengeInput = {
  title: string
  description: string
  challengeType: "steps" | "walking_days" | "distance"
  goal: number
  startDate: string
  endDate: string
}

export type AuthResponse = {
  user: User
  tokens: { accessToken: string; refreshToken: string; expiresIn: number }
}

export type PagedUsers = { items: User[]; total: number }
export type PagedChallenges = { items: Challenge[]; total: number }

export type StepsSummary = {
  stepsToday: number
  stepsWeek: number
  stepsMonth: number
  distanceWeekKm: number
  lifetimeDistanceKm: number
  personalBest: number
  personalBestDate: string
}

export type Program = {
  id: string
  nutritionType: string
  dailySteps: number
  sleepGoal: number
  resistanceDays: number
  stressGoal: string
  source: "generated" | "assigned"
  assignedBy?: string | null
  clinicianNotes?: string
  planGeneratedAt?: string | null
  planDetail?: NutritionPlanDetail | null
}

export type NutritionMealPlan = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  title: string
  description: string
  ingredients: string[]
  preparation: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  tips: string
}

export type NutritionPlanDetail = {
  protocolTitle: string
  protocolSummary: string
  reason: string
  culturalFocus: string
  diagnosisLabel: string
  macroTargets: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
    fiberG: number
    waterL: number
  }
  guidelines: string[]
  fastingRecommendation: string
  meals: NutritionMealPlan[]
  weeklyFocus: string[]
  groceryList: string[]
  foodsToEmphasize: string[]
  foodsToLimit: string[]
  doctorNotesApplied?: string
  generatedBy?: "llm" | "fallback"
}

export type ProgramInput = {
  nutritionType: string
  dailySteps?: number
  sleepGoal?: number
  resistanceDays?: number
  stressGoal?: string
  clinicianNotes?: string
}

export type PatientDetail = {
  user: User
  profile?: Profile | null
  assessments?: Assessment[]
  stepsSummary?: StepsSummary | null
  latestMetrics?: HealthMetric[]
  program?: Program | null
}

export type StepsOverview = {
  totalSteps: number
  totalDistanceKm: number
  activeWalkers: number
  avgSteps: number
  activeChallenges: number
  periodDays: number
}

export type TopWalker = {
  userId: string
  firstName: string
  lastName: string
  email: string
  totalSteps: number
  totalDistanceKm: number
}

export type AdminTeam = {
  id: string
  name: string
  description: string
  ownerId: string
  visibility: string
  kind: string
  goalSteps: number
  memberCount: number
  ownerFirstName?: string
  ownerLastName?: string
  createdAt?: string
}

export type AdminJourney = {
  id: string
  slug: string
  title: string
  description: string
  goalKm: number
  sortOrder: number
  landmarks?: unknown
  starters?: number
  avgDistanceKm?: number
}

export type AdminReward = {
  id: string
  code: string
  title: string
  description: string
  costXp: number
  active: boolean
}

export type AdminEvent = {
  id: string
  hostId: string
  title: string
  description: string
  kind: string
  startsAt: string
  location: string
  hostFirstName?: string
  hostLastName?: string
  goingCount?: number
}

export type AdminFeedPost = {
  id: string
  userId: string
  body: string
  kind: string
  visibility: string
  firstName?: string
  lastName?: string
  email?: string
  likeCount?: number
  commentCount?: number
  createdAt?: string
}

export type SocialOverview = {
  friendPairs: number
  pendingFriendRequests: number
  activeBuddyPairs: number
  pendingBuddyRequests: number
  buddyPairs: Array<{
    id: string
    status: string
    aFirstName?: string
    aLastName?: string
    aEmail?: string
    bFirstName?: string
    bLastName?: string
    bEmail?: string
    updatedAt?: string
  }>
}

export type AcademyCourse = {
  id: string
  slug: string
  title: string
  summary: string
  level: string
  sortOrder: number
  coverImageUrl: string
  published: boolean
  lessonCount: number
  updatedAt?: string
}

export type AcademyLesson = {
  id: string
  courseId: string
  title: string
  description: string
  sortOrder: number
  videoUrl: string
  thumbnailUrl: string
  durationSeconds: number
  published: boolean
}

export class ApiError extends Error {
  status: number
  fields?: Record<string, string>
  constructor(
    status: number,
    message: string,
    fields?: Record<string, string>
  ) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

const ACCESS_KEY = "imm5_admin_access"
const REFRESH_KEY = "imm5_admin_refresh"
const USER_KEY = "imm5_admin_user"

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshing: Promise<boolean> | null = null

export const tokens = {
  hydrate() {
    if (typeof window === "undefined") return null
    accessToken = localStorage.getItem(ACCESS_KEY)
    refreshToken = localStorage.getItem(REFRESH_KEY)
    return accessToken
  },
  set(access: string, refresh: string) {
    accessToken = access
    refreshToken = refresh
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear() {
    accessToken = null
    refreshToken = null
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
  get access() {
    return accessToken
  },
  get refresh() {
    return refreshToken
  },
}

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function loadUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

type Options = { method?: string; body?: unknown; auth?: boolean }

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) {
    tokens.hydrate()
  }
  if (!refreshToken) return false
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    const json = await res.json()
    if (!res.ok) return false
    const t = json.data?.tokens ?? json.data
    if (!t?.accessToken || !t?.refreshToken) return false
    tokens.set(t.accessToken, t.refreshToken)
    return true
  } catch {
    return false
  }
}

async function request<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts
  if (auth && !accessToken) tokens.hydrate()

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth) {
    if (!refreshing)
      refreshing = tryRefresh().finally(() => {
        refreshing = null
      })
    const ok = await refreshing
    if (ok) return request<T>(path, opts)
    tokens.clear()
    throw new ApiError(401, "Session expired")
  }

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.message ?? `Request failed (${res.status})`,
      json?.error?.fields
    )
  }
  return json.data as T
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, { method: "POST", body, auth }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  /** Multipart upload (call recordings). Do not set Content-Type — browser sets boundary. */
  upload: async <T>(path: string, form: FormData): Promise<T> => {
    if (!accessToken) tokens.hydrate()
    const headers: Record<string, string> = {}
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: form,
    })
    const text = await res.text()
    const json = text ? JSON.parse(text) : {}
    if (!res.ok) {
      throw new ApiError(
        res.status,
        json?.error?.message ?? `Upload failed (${res.status})`
      )
    }
    return json.data as T
  },
}
