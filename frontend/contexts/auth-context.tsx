"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { AuthService, type AuthState } from "@/lib/auth"

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const authService = AuthService.getInstance()

  useEffect(() => {
    // Check for existing authentication on mount
    const checkAuth = async () => {
      try {
        const user = authService.getCurrentUser()
        if (user) {
          // Verify token is still valid by making a request
          const refreshedUser = await authService.refreshUser()
          setAuthState({
            user: refreshedUser,
            isLoading: false,
            isAuthenticated: !!refreshedUser,
          })
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        // Token is invalid, clear auth
        await authService.logout()
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }))
    try {
      const { user } = await authService.login(email, password)
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
      
      // Redirect to dashboard after successful login
      window.location.href = "/"
    } catch (error) {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    setAuthState((prev: AuthState) => ({ ...prev, isLoading: true }))
    try {
      const { user } = await authService.signup(email, password, name)
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      })
      
      // Redirect to dashboard after successful signup
      window.location.href = "/"
    } catch (error) {
      setAuthState((prev: AuthState) => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = async () => {
    await authService.logout()
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
    
    // Redirect to login page after logout
    window.location.href = "/"
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
