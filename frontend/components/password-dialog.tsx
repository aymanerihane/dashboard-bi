"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"

interface PasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  databaseName: string
  onConfirm: (password: string, savePassword?: boolean) => void
  onCancel: () => void
  loading?: boolean
  error?: string
  showSavePassword?: boolean
}

export function PasswordDialog({
  open,
  onOpenChange,
  databaseName,
  onConfirm,
  onCancel,
  loading = false,
  error,
  showSavePassword = true
}: PasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [savePassword, setSavePassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    onConfirm(password, showSavePassword ? savePassword : undefined)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  }

  const handleCancel = () => {
    setPassword("")
    setSavePassword(false)
    setShowPassword(false)
    onCancel()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            Please enter your password to connect to database: <strong>{databaseName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Database Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your database password"
                className="pr-10"
                disabled={loading}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            {/* Connect button is always enabled to allow form submission */}
            <Button type="submit" disabled={false} >
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export with old name for backward compatibility
export const PasswordConfirmationDialog = PasswordDialog

// Export with new name for new usage
export default PasswordDialog
