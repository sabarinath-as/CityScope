import { createContext, useContext, useState, useEffect } from 'react'
import { adminAPI } from '../api'

const Ctx = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token   = localStorage.getItem('admin_access_token')
    const stored  = localStorage.getItem('admin_user')
    if (token && stored) {
      try { setAdmin(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = async creds => {
    const { data } = await adminAPI.login(creds)
    localStorage.setItem('admin_access_token',  data.access)
    localStorage.setItem('admin_refresh_token', data.refresh)
    localStorage.setItem('admin_user', JSON.stringify(data.user))
    setAdmin(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('admin_access_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_user')
    setAdmin(null)
  }

  return (
    <Ctx.Provider value={{ admin, loading, login, logout }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAdminAuth = () => useContext(Ctx)
