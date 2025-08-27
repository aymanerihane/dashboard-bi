"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { DatabaseConfig } from "@/lib/database"

interface PasswordConfirmationState {
  showPasswordDialog: boolean
  selectedDatabase: DatabaseConfig | null
  onConfirmCallback: ((password: string, savePassword?: boolean) => void) | null
  error?: string
}

interface DatabaseConnectionContextType {
  passwordState: PasswordConfirmationState
  savedPasswords: Record<string, string> // database id -> password
  requestConnection: (database: DatabaseConfig, onConfirm: (password: string, savePassword?: boolean) => void) => void
  closePasswordDialog: () => void
  savePassword: (databaseId: string, password: string) => void
  hasStoredPassword: (databaseId: string) => boolean
  getStoredPassword: (databaseId: string) => string | null
  setPasswordError: (error: string | undefined) => void
}

const DatabaseConnectionContext = createContext<DatabaseConnectionContextType | undefined>(undefined)

interface DatabaseConnectionProviderProps {
  children: ReactNode
}

export function DatabaseConnectionProvider({ children }: DatabaseConnectionProviderProps) {
  const [passwordState, setPasswordState] = useState<PasswordConfirmationState>({
    showPasswordDialog: false,
    selectedDatabase: null,
    onConfirmCallback: null,
    error: undefined,
  })
  
  const [savedPasswords, setSavedPasswords] = useState<Record<string, string>>(() => {
    // Load saved passwords from localStorage
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dashboard-saved-passwords")
        return saved ? JSON.parse(saved) : {}
      } catch {
        return {}
      }
    }
    return {}
  })

  const requestConnection = (
    database: DatabaseConfig, 
    onConfirm: (password: string, savePassword?: boolean) => void
  ) => {
    // For SQLite and MongoDB Atlas, bypass password dialog and connect directly
    if (database.type === "sqlite" || database.type === "mongodb-atlas") {
      // Connect directly without password for these database types
      onConfirm("", false)
      return
    }

    // Check if we have a saved password for this database
    const storedPassword = savedPasswords[database.id]
    if (storedPassword) {
      // Auto-connect with stored password
      onConfirm(storedPassword, true)
      return
    }

    // Show password dialog for other database types
    setPasswordState({
      showPasswordDialog: true,
      selectedDatabase: database,
      onConfirmCallback: (password: string, savePassword?: boolean) => {
        onConfirm(password, savePassword || false)
      },
      error: undefined,
    })
  }

  const closePasswordDialog = () => {
    setPasswordState({
      showPasswordDialog: false,
      selectedDatabase: null,
      onConfirmCallback: null,
      error: undefined,
    })
  }

  const setPasswordError = (error: string | undefined) => {
    setPasswordState(prev => ({ ...prev, error }))
  }

  const savePassword = (databaseId: string, password: string) => {
    const updated = { ...savedPasswords, [databaseId]: password }
    setSavedPasswords(updated)
    
    // Save to localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dashboard-saved-passwords", JSON.stringify(updated))
      } catch (error) {
        console.error("Failed to save password to localStorage:", error)
      }
    }
  }

  const hasStoredPassword = (databaseId: string): boolean => {
    return !!savedPasswords[databaseId]
  }

  const getStoredPassword = (databaseId: string): string | null => {
    return savedPasswords[databaseId] || null
  }

  return (
    <DatabaseConnectionContext.Provider
      value={{
        passwordState,
        savedPasswords,
        requestConnection,
        closePasswordDialog,
        savePassword,
        hasStoredPassword,
        getStoredPassword,
        setPasswordError,
      }}
    >
      {children}
    </DatabaseConnectionContext.Provider>
  )
}

export function useDatabaseConnection() {
  const context = useContext(DatabaseConnectionContext)
  if (context === undefined) {
    throw new Error("useDatabaseConnection must be used within a DatabaseConnectionProvider")
  }
  return context
}
