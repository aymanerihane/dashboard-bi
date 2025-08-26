import { apiClient } from "./api"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  avatar?: string
  createdAt: Date
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export class AuthService {
  private static instance: AuthService
  private currentUser: User | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      const response = await apiClient.login(email, password)

      if (!response.success) {
        throw new Error("Login failed")
      }

      const user: User = {
        ...response.user,
        createdAt: new Date(),
      }

      this.currentUser = user
      apiClient.setToken(response.token)

      // Store user in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("auth-user", JSON.stringify(user))
      }

      return { user, token: response.token }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed")
    }
  }

  async signup(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    try {
      // First register the user
      await apiClient.register(name, email, password)

      // Then login to get the token
      return await this.login(email, password)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Signup failed")
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    apiClient.clearToken()
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-user")
    }
  }

  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser

    // Try to restore from localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth-token")
      const userStr = localStorage.getItem("auth-user")
      if (token && userStr) {
        try {
          this.currentUser = JSON.parse(userStr)
          apiClient.setToken(token)
          return this.currentUser
        } catch {
          // Invalid stored data, clear it
          localStorage.removeItem("auth-token")
          localStorage.removeItem("auth-user")
        }
      }
    }

    return null
  }

  async refreshUser(): Promise<User | null> {
    try {
      const userData = await apiClient.getCurrentUser()
      const user: User = {
        ...userData,
        createdAt: new Date(),
      }

      this.currentUser = user
      if (typeof window !== "undefined") {
        localStorage.setItem("auth-user", JSON.stringify(user))
      }

      return user
    } catch {
      // Token might be invalid, logout
      await this.logout()
      return null
    }
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}
