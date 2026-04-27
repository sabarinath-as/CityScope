import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    if (!localStorage.getItem('access_token')) { setLoading(false); return }
    try { const { data } = await authAPI.me(); setUser(data) }
    catch { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async creds => {
    const { data } = await authAPI.login(creds)
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data
  }

  const logout = async () => {
    const r = localStorage.getItem('refresh_token')
    try { if (r) await authAPI.logout(r) } catch {}
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const register = async d => {
    const { data } = await authAPI.register(d)
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data
  }

  return (
    <Ctx.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
