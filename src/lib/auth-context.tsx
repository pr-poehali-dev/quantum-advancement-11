import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api, setToken, clearToken, getToken, setUserId, clearUserId } from './api'

interface User {
  id: number
  nickname: string
  email: string
  phone: string
  role: string
  customer_code: string
}

interface AuthCtx {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (data: { nickname: string; email: string; phone: string; password: string }) => Promise<{ error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    api.auth.me().then(res => {
      if (res.user) setUser(res.user)
      else clearToken()
      setLoading(false)
    }).catch(() => { clearToken(); setLoading(false) })
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await api.auth.login({ email, password })
      if (!res || res.error) return { error: res?.error || 'Ошибка соединения' }
      setToken(res.token)
      if (res.user?.id) setUserId(res.user.id)
      setUser(res.user)
      return {}
    } catch {
      return { error: 'Не удалось подключиться. Попробуйте ещё раз.' }
    }
  }

  const register = async (data: { nickname: string; email: string; phone: string; password: string }) => {
    try {
      const res = await api.auth.register(data)
      if (!res || res.error) return { error: res?.error || 'Ошибка соединения' }
      setToken(res.token)
      if (res.user?.id) setUserId(res.user.id)
      setUser(res.user)
      return {}
    } catch {
      return { error: 'Не удалось подключиться. Попробуйте ещё раз.' }
    }
  }

  const logout = async () => {
    await api.auth.logout()
    clearToken()
    clearUserId()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}