"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import type { DatabaseConfig } from "@/lib/database"
import { apiClient } from "@/lib/api"

interface ConnectionFormProps {
  onSave: (config: DatabaseConfig) => void
  onCancel: () => void
  initialConfig?: DatabaseConfig
}

export function ConnectionForm({ onSave, onCancel, initialConfig }: ConnectionFormProps) {
  const [config, setConfig] = useState<Partial<DatabaseConfig>>({
    name: initialConfig?.name || "",
    type: initialConfig?.type || "postgresql",
    host: initialConfig?.host || "localhost",
    port: initialConfig?.port || 5432,
    database: initialConfig?.database || "",
    username: initialConfig?.username || "",
    password: initialConfig?.password || "",
    filename: initialConfig?.filename || "",
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTypeChange = (type: "postgresql" | "mysql" | "sqlite") => {
    setConfig((prev) => ({
      ...prev,
      type,
      port: type === "mysql" ? 3306 : type === "postgresql" ? 5432 : undefined,
    }))
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      if (config.type === "sqlite") {
        // SQLite validation - local only
        const success = !!(config.database && config.filename)
        const message = success
          ? "SQLite connection validated successfully!"
          : "Please provide both database name and file path for SQLite."
        setTestResult({ success, message })
      } else {
        // PostgreSQL/MySQL validation - use API
        const hasRequiredFields = !!(config.host && config.database && config.username && config.password)
        const isValidPort = config.port && config.port > 0 && config.port < 65536

        if (!hasRequiredFields) {
          setTestResult({
            success: false,
            message: "Please fill in all required fields (host, database, username, password)."
          })
        } else if (!isValidPort) {
          setTestResult({
            success: false,
            message: "Please provide a valid port number (1-65535)."
          })
        } else {
          // Test connection via API
          const result = await apiClient.testConnectionStandalone({
            type: config.type,
            host: config.host!,
            port: config.port!,
            database: config.database!,
            username: config.username!,
            password: config.password!,
          })
          
          setTestResult({
            success: result.success,
            message: result.message
          })
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed"
      })
    }

    setTesting(false)
  }

  const handleSave = () => {
    if (!config.name || !config.database) return

    const newConfig: DatabaseConfig = {
      id: initialConfig?.id || `db-${Date.now()}`,
      name: config.name,
      type: config.type as "postgresql" | "mysql" | "sqlite",
      database: config.database,
      host: config.type !== "sqlite" ? config.host : undefined,
      port: config.type !== "sqlite" ? config.port : undefined,
      username: config.type !== "sqlite" ? config.username : undefined,
      password: config.type !== "sqlite" ? config.password : undefined,
      filename: config.type === "sqlite" ? config.filename : undefined,
    }

    onSave(newConfig)
  }

  const isValid = config.name && config.database && (config.type === "sqlite" || (config.host && config.username))

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif font-bold">
          {initialConfig ? "Edit Connection" : "Add Database Connection"}
        </CardTitle>
        <CardDescription>Configure your database connection settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Database"
              value={config.name}
              onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Database Type</Label>
            <Select value={config.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {config.type === "sqlite" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="my_database.db"
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filename">File Path</Label>
              <Input
                id="filename"
                placeholder="/path/to/database.db"
                value={config.filename}
                onChange={(e) => setConfig((prev) => ({ ...prev, filename: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={config.host}
                  onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="5432"
                  value={config.port}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: Number.parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="my_database"
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={config.username}
                  onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={config.password}
                  onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {testResult && (
          <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                {testResult.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={!isValid || testing}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={!isValid}>
            {initialConfig ? "Update Connection" : "Save Connection"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
