import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authApi } from '../api/endpoints'
import { api } from '../api/client'

interface AuthContextType {
  login: (email: string, password: string) => Promise<void>
  loginWithWallet: (publicKey: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  user: ReturnType<typeof useAuthStore.getState>['user']
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem('auth_token')
    return stored || null
  } catch {
    return null
  }
}

function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading, logout: clearAuth } = useAuthStore()

  useEffect(() => {
    const token = getStoredToken()
    if (token) {
      api.setToken(token)
      authApi.me()
        .then((user) => setUser(user))
        .catch(() => {
          setStoredToken(null)
          api.setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [setUser, setIsLoading])

  const login = async (email: string, password: string) => {
    const { access_token, user } = await authApi.login({ email, password })
    setStoredToken(access_token)
    api.setToken(access_token)
    setUser(user)
  }

  const loginWithWallet = async (publicKey: string) => {
    const res = await authApi.stellarLogin({ walletAddress: publicKey })
    const token = res.access_token || res.token
    if (token) {
      setStoredToken(token)
      api.setToken(token)
    }
    setUser(res.user)
  }

  const signup = async (email: string, password: string, name: string) => {
    const { user } = await authApi.signup({ email, password, name })
    setUser(user)
  }

  const logout = () => {
    setStoredToken(null)
    api.setToken(null)
    clearAuth()
  }

  return (
    <AuthContext.Provider value={{ login, loginWithWallet, signup, logout, isLoading, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
