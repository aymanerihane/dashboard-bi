"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { DatabaseConfig } from "@/lib/database"

interface PasswordConfirmationState {
  showPasswordDialog: boolean
  selectedDatabase: DatabaseConfig | null
  onConfirmCallback: ((password: string, savePassword: boolean) => void) | null
}

interface DatabaseConnectionContextType {
  passwordState: PasswordConfirmationState
  savedPasswords: Record<string, string> // database id -> password
  requestConnection: (database: DatabaseConfig, onConfirm: (password: string, savePassword: boolean) => void) => void
  closePasswordDialog: () => void
  savePassword: (databaseId: string, password: string) => void
  hasStoredPassword: (databaseId: string) => boolean
  getStoredPassword: (databaseId: string) => string | null
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
    onConfirm: (password: string, savePassword: boolean) => void
  ) => {
    // Check if we have a saved password for this database
    const storedPassword = savedPasswords[database.id]
    if (storedPassword) {
      // Auto-connect with stored password
      onConfirm(storedPassword, true)
      return
    }

    // Show password dialog
    setPasswordState({
      showPasswordDialog: true,
      selectedDatabase: database,
      onConfirmCallback: onConfirm,
    })
  }

  const closePasswordDialog = () => {
    setPasswordState({
      showPasswordDialog: false,
      selectedDatabase: null,
      onConfirmCallback: null,
    })
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
