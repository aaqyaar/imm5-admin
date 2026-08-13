import type { IconSvgElement } from "@hugeicons/react"
import {
  BookOpen01Icon,
  Calendar03Icon,
  Call02Icon,
  ChartLineData01Icon,
  DashboardSquare01Icon,
  Flag01Icon,
  GiftIcon,
  Home01Icon,
  MapsGlobal01Icon,
  Message01Icon,
  UserGroupIcon,
  UserMultipleIcon,
  WalkingIcon,
} from "@hugeicons/core-free-icons"

export type ModuleGroup = "home" | "care" | "steps" | "academy" | "insights"

export type AppModule = {
  id: string
  href: string
  label: string
  description: string
  group: ModuleGroup
  icon: IconSvgElement
  /** Accent used on module tiles */
  tone: string
  /** When set, only admins see this module (API still enforces). */
  adminOnly?: boolean
}

export const MODULE_GROUPS: { id: ModuleGroup; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "care", label: "Patient care" },
  { id: "steps", label: "Steps community" },
  { id: "academy", label: "Education" },
  { id: "insights", label: "Insights" },
]

export const MODULES: AppModule[] = [
  {
    id: "overview",
    href: "/",
    label: "Dashboard",
    description: "System insights and growth",
    group: "home",
    icon: DashboardSquare01Icon,
    tone: "bg-[#2F6F64]",
  },
  {
    id: "patients",
    href: "/patients",
    label: "Patients",
    description: "Accounts, status, metabolic profile",
    group: "care",
    icon: UserMultipleIcon,
    tone: "bg-[#3D6B8C]",
  },
  {
    id: "appointments",
    href: "/appointments",
    label: "Appointments",
    description: "Accept and join video / phone calls",
    group: "care",
    icon: Calendar03Icon,
    tone: "bg-[#2C5F7C]",
  },
  {
    id: "recordings",
    href: "/recordings",
    label: "Recordings",
    description: "Consultation recordings library",
    group: "care",
    icon: Call02Icon,
    tone: "bg-[#3D5A80]",
  },
  {
    id: "calls",
    href: "/calls",
    label: "Call monitoring",
    description: "WebRTC quality, TURN vs P2P, duration",
    group: "care",
    icon: Call02Icon,
    tone: "bg-[#1F4E79]",
    adminOnly: true,
  },
  {
    id: "ice-settings",
    href: "/calls/settings",
    label: "Call ICE settings",
    description: "Janus, static TURN/STUN, or Cloudflare",
    group: "care",
    icon: Call02Icon,
    tone: "bg-[#245B7A]",
    adminOnly: true,
  },
  {
    id: "steps",
    href: "/steps",
    label: "Steps",
    description: "Engagement and top walkers",
    group: "steps",
    icon: WalkingIcon,
    tone: "bg-[#2F6F64]",
  },
  {
    id: "challenges",
    href: "/challenges",
    label: "Challenges",
    description: "Walking challenges catalog",
    group: "steps",
    icon: Flag01Icon,
    tone: "bg-[#C4784A]",
  },
  {
    id: "teams",
    href: "/teams",
    label: "Teams",
    description: "Groups, members, goals",
    group: "steps",
    icon: UserGroupIcon,
    tone: "bg-[#4A7C59]",
  },
  {
    id: "journeys",
    href: "/journeys",
    label: "Journeys",
    description: "Virtual walking routes",
    group: "steps",
    icon: MapsGlobal01Icon,
    tone: "bg-[#5B6B8C]",
  },
  {
    id: "rewards",
    href: "/rewards",
    label: "Rewards",
    description: "XP catalog and redemptions",
    group: "steps",
    icon: GiftIcon,
    tone: "bg-[#A67C52]",
  },
  {
    id: "events",
    href: "/events",
    label: "Events",
    description: "Community walks and RSVPs",
    group: "steps",
    icon: Calendar03Icon,
    tone: "bg-[#6B5B8C]",
  },
  {
    id: "feed",
    href: "/feed",
    label: "Feed",
    description: "Moderate community posts",
    group: "steps",
    icon: Message01Icon,
    tone: "bg-[#8C5B6B]",
  },
  {
    id: "social",
    href: "/social",
    label: "Social",
    description: "Friends and buddy pairs",
    group: "steps",
    icon: Home01Icon,
    tone: "bg-[#5B8C7A]",
  },
  {
    id: "academy",
    href: "/academy",
    label: "Academy",
    description: "Courses, lessons, videos",
    group: "academy",
    icon: BookOpen01Icon,
    tone: "bg-[#2F6F64]",
  },
  {
    id: "reports",
    href: "/reports",
    label: "Reports",
    description: "Growth and participation",
    group: "insights",
    icon: ChartLineData01Icon,
    tone: "bg-[#6B6A66]",
  },
]

export function moduleForPath(pathname: string): AppModule | undefined {
  if (pathname === "/") return MODULES.find((m) => m.id === "overview")
  return MODULES.find((m) => m.href !== "/" && pathname.startsWith(m.href))
}

export function modulesByGroup(group: ModuleGroup) {
  return MODULES.filter((m) => m.group === group)
}

export function modulesForRole(role: string | undefined) {
  return MODULES.filter((m) => !m.adminOnly || role === "admin")
}
