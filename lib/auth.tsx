"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  api,
  ApiError,
  isStaffRole,
  loadUser,
  saveUser,
  tokens,
  type AuthResponse,
  type User,
} from "@/lib/api"

type AuthState = {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    tokens.hydrate()
    const cached = loadUser()
    if (cached && tokens.access && isStaffRole(cached.role)) {
      setUser(cached)
    }
    setReady(true)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthResponse>(
      "/auth/login",
      { email, password },
      false
    )
    if (!isStaffRole(data.user.role)) {
      throw new ApiError(403, "This console is for clinicians and staff only.")
    }
    tokens.set(data.tokens.accessToken, data.tokens.refreshToken)
    saveUser(data.user)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    tokens.clear()
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const me = await api.get<User>("/auth/me")
    if (!isStaffRole(me.role)) {
      logout()
      throw new ApiError(403, "Staff access required.")
    }
    saveUser(me)
    setUser(me)
  }, [logout])

  const value = useMemo(
    () => ({ user, ready, login, logout, refreshMe }),
    [user, ready, login, logout, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
