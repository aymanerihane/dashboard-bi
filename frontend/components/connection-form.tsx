"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle, XCircle, Upload, Database, Globe, HardDrive } from "lucide-react"
import type { DatabaseConfig } from "@/lib/database"
import { apiClient } from "@/lib/api"

interface ConnectionFormProps {
  onSave: (config: DatabaseConfig) => void
  onCancel: () => void
  initialConfig?: DatabaseConfig
  testOnly?: boolean // New prop for test-only mode
}

type DatabaseType = "postgresql" | "mysql" | "sqlite" | "mongodb" | "mongodb-atlas" | "redis" | "cassandra"

export function ConnectionForm({ onSave, onCancel, initialConfig, testOnly = false }: ConnectionFormProps) {
  const [config, setConfig] = useState<Partial<DatabaseConfig>>({
    name: initialConfig?.name || "",
    type: (initialConfig?.type as DatabaseType) || "postgresql",
    host: initialConfig?.host || "localhost",
    port: initialConfig?.port || getDefaultPort("postgresql"),
    database: initialConfig?.database || "",
    username: initialConfig?.username || "",
    password: "", // Never store passwords
    filename: initialConfig?.filename || "",
    connectionString: initialConfig?.connectionString || "",
    cluster: initialConfig?.cluster || "",
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number; error?: string } | null>(null)
  const [tempPassword, setTempPassword] = useState("") // Temporary password for testing only
  const [connectionTested, setConnectionTested] = useState(false) // Track if connection was successfully tested
  const [autoTestEnabled, setAutoTestEnabled] = useState(false)
  const [fileContent, setFileContent] = useState<File | null>(null)
  const [showPasswordField, setShowPasswordField] = useState(false) // Show password field only after auth failure
  const [authenticationRequired, setAuthenticationRequired] = useState(false) // Track if auth is required

  // Extract password from MongoDB Atlas connection string
  const extractPasswordFromConnectionString = (connectionString: string): string | null => {
    try {
      const match = connectionString.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@/)
      return match ? match[2] : null
    } catch {
      return null
    }
  }

  // Extract database name from MongoDB Atlas connection string
  const extractDatabaseFromConnectionString = (connectionString: string): string | null => {
    try {
      // Try to extract database from the path part of the connection string
      const url = new URL(connectionString)
      const pathParts = url.pathname.split('/')
      if (pathParts.length > 1 && pathParts[1]) {
        return pathParts[1]
      }
      return null
    } catch {
      return null
    }
  }

  // Get default port for database type
  function getDefaultPort(type: DatabaseType): number | undefined {
    const defaultPorts = {
      postgresql: 5432,
      mysql: 3306,
      mongodb: 27017,
      "mongodb-atlas": 27017,
      redis: 6379,
      cassandra: 9042,
      sqlite: undefined
    }
    return defaultPorts[type]
  }

  // Clear any stored passwords on component mount and reset test status
  useEffect(() => {
    setConfig(prev => ({ ...prev, password: "" }))
    setConnectionTested(false)
  }, [])

  // Reset connection tested when important config changes
  useEffect(() => {
    setConnectionTested(false)
    setTestResult(null)
    setShowPasswordField(false)
    setAuthenticationRequired(false)
    setTempPassword("")
  }, [config.host, config.port, config.database, config.username, config.type, config.connectionString])

  // Auto-populate database name from MongoDB Atlas connection string
  useEffect(() => {
    if (config.type === "mongodb-atlas" && config.connectionString && !config.database) {
      const extractedDatabase = extractDatabaseFromConnectionString(config.connectionString)
      if (extractedDatabase) {
        setConfig(prev => ({ ...prev, database: extractedDatabase }))
      }
    }
  }, [config.connectionString, config.type])

  // Auto-test connection when all required fields are filled
  useEffect(() => {
    if (autoTestEnabled && canTest && !testing) {
      const timer = setTimeout(() => {
        testConnection()
      }, 1000) // Debounce for 1 second
      
      return () => clearTimeout(timer)
    }
  }, [config, tempPassword, autoTestEnabled])

  const handleTypeChange = (type: DatabaseType) => {
    const defaultPort = getDefaultPort(type)
    
    setConfig((prev) => ({
      ...prev,
      type,
      port: defaultPort,
      // Clear type-specific fields when switching
      connectionString: type === "mongodb-atlas" ? prev.connectionString : "",
      filename: type === "sqlite" ? prev.filename : "",
      host: type === "sqlite" ? undefined : prev.host || "localhost",
      username: (type === "sqlite" || type === "mongodb-atlas") ? undefined : prev.username,
    }))
    
    // Clear password when switching types
    setTempPassword("")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith('.db')) {
      setFileContent(file)
      setConfig(prev => ({
        ...prev,
        filename: file.name,
        database: file.name.replace('.db', '')
      }))
    }
  }

  const testConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      let result: { success: boolean; message: string; latency?: number; error?: string }

      if (config.type === "sqlite") {
        // SQLite validation - check if file is uploaded or path provided
        if (fileContent) {
          result = {
            success: true,
            message: "SQLite file uploaded successfully!",
            latency: 1
          }
        } else if (config.filename && config.database) {
          result = {
            success: true,
            message: "SQLite configuration validated successfully!",
            latency: 1
          }
        } else {
          result = {
            success: false,
            message: "Please upload a SQLite file or provide both database name and file path.",
            error: "Missing SQLite file or file path"
          }
        }
      } else if (config.type === "mongodb-atlas") {
        // MongoDB Atlas - only connection string needed
        if (!config.connectionString) {
          result = {
            success: false,
            message: "Please provide a MongoDB Atlas connection string.",
            error: "Missing MongoDB Atlas connection string"
          }
        } else {
                      // Extract password from connection string for Atlas
            const extractedPassword = extractPasswordFromConnectionString(config.connectionString);
            const extractedDatabase = extractDatabaseFromConnectionString(config.connectionString);
            
            // Test Atlas connection
            result = await apiClient.testConnectionStandalone({
              type: "mongodb-atlas",
              connectionString: config.connectionString,
              database: extractedDatabase || config.database || "test",
              password: extractedPassword || undefined
            })
        }
      } else if (config.type === "redis") {
        // Redis - host, port, and optional database index
        if (!config.host || !config.port) {
          result = {
            success: false,
            message: "Please provide host and port for Redis connection.",
            error: "Missing host or port for Redis"
          }
        } else {
          result = await apiClient.testConnectionStandalone({
            type: config.type,
            host: config.host,
            port: config.port,
            database: config.database || "0",
            password: tempPassword || undefined
          })
        }
      } else {
        // Standard databases (PostgreSQL, MySQL, MongoDB, Cassandra)
        const hasRequiredFields = !!(config.host && config.database && config.username)
        const isValidPort = config.port && config.port > 0 && config.port < 65536

        if (!hasRequiredFields) {
          result = {
            success: false,
            message: "Please fill in all required fields (host, database, username).",
            error: "Missing required connection fields"
          }
        } else if (!isValidPort) {
          result = {
            success: false,
            message: "Please provide a valid port number (1-65535).",
            error: "Invalid port number"
          }
        } else {
          // Test connection via API
          result = await apiClient.testConnectionStandalone({
            type: config.type as string,
            host: config.host!,
            port: config.port!,
            database: config.database!,
            username: config.username!,
            password: tempPassword,
          })
        }
      }
      
      setTestResult(result)
      
      if (result.success) {
        setConnectionTested(true)
        setAuthenticationRequired(false)
        setShowPasswordField(false)
      } else {
        // Check if the error indicates authentication is required
        const authErrors = [
          'authentication failed',
          'access denied',
          'login failed',
          'invalid credentials',
          'password authentication failed',
          'authentication required',
          'unauthorized'
        ]
        
        const isAuthError = authErrors.some(error => 
          (result.error && result.error.toLowerCase().includes(error)) || 
          (result.message && result.message.toLowerCase().includes(error))
        )
        
        if (isAuthError && !tempPassword && !showPasswordField) {
          setAuthenticationRequired(true)
          setShowPasswordField(true)
          setTestResult({
            success: false,
            message: "Authentication required - please enter your password",
          })
        }
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
        error: error instanceof Error ? error.message : "Unknown error"
      })
    }

    setTesting(false)
  }

  const handleSave = () => {
    if (!isValidForSave) return

    let passwordToSave = tempPassword || config.password;
    
    // For MongoDB Atlas, extract password and database from connection string
    if (config.type === "mongodb-atlas" && config.connectionString) {
      const extractedPassword = extractPasswordFromConnectionString(config.connectionString);
      const extractedDatabase = extractDatabaseFromConnectionString(config.connectionString);
      if (extractedPassword) {
        passwordToSave = extractedPassword;
      }
      if (extractedDatabase) {
        config.database = extractedDatabase;
      }
    }

    const newConfig: DatabaseConfig = {
      id: initialConfig?.id || Date.now(),
      name: config.name!,
      type: config.type as "postgresql" | "mysql" | "sqlite" | "mongodb-atlas" | "redis" | "cassandra",
      database: config.database!,
      host: config.type !== "sqlite" ? config.host : undefined,
      port: config.type !== "sqlite" ? config.port : undefined,
      username: config.type !== "sqlite" && config.type !== "mongodb-atlas" && config.type !== "redis" ? config.username : undefined,
      password: passwordToSave, // Include the password (extracted for Atlas)
      filename: config.type === "sqlite" ? config.filename : undefined, // Legacy field
      file_path: config.type === "sqlite" ? (config.filename || config.database) : undefined, // New field for backend
      connectionString: config.type === "mongodb-atlas" ? config.connectionString : undefined, // Legacy field
      connection_string: config.type === "mongodb-atlas" ? config.connectionString : undefined, // New field for backend
      cluster: config.cluster,
    }

    // Debug logging for MongoDB Atlas
    if (config.type === "mongodb-atlas") {
      console.log("Saving MongoDB Atlas connection:")
      console.log("Database name:", config.database)
      console.log("Connection string:", config.connectionString)
      console.log("Extracted database:", extractDatabaseFromConnectionString(config.connectionString || ""))
    }

    onSave(newConfig)
  }

  // Enhanced validation logic
  const getValidationStatus = () => {
    if (!testOnly && !config.name) return { valid: false, message: "Connection name is required" }
    
    switch (config.type) {
      case "sqlite":
        if (!config.database) return { valid: false, message: "Database name is required" }
        if (!config.filename && !fileContent) return { valid: false, message: "SQLite file or file path is required" }
        return { valid: true, message: "SQLite configuration is valid" }
        
      case "mongodb-atlas":
        if (!config.connectionString) return { valid: false, message: "Connection string is required" }
        if (!config.connectionString.includes("mongodb+srv://")) return { valid: false, message: "Invalid MongoDB Atlas connection string format" }
        if (!config.database) return { valid: false, message: "Database name is required" }
        return { valid: true, message: "MongoDB Atlas configuration is valid" }
        
      case "redis":
        if (!config.host) return { valid: false, message: "Host is required" }
        if (!config.port || config.port <= 0 || config.port >= 65536) return { valid: false, message: "Valid port number is required" }
        return { valid: true, message: "Redis configuration is valid" }
        
      default:
        if (!config.host) return { valid: false, message: "Host is required" }
        if (!config.port || config.port <= 0 || config.port >= 65536) return { valid: false, message: "Valid port number is required" }
        if (!config.database) return { valid: false, message: "Database name is required" }
        if (!config.username) return { valid: false, message: "Username is required" }
        return { valid: true, message: "Configuration is valid" }
    }
  }

  const validationStatus = getValidationStatus()
  const canTest = validationStatus.valid && (
    config.type === "sqlite" || 
    config.type === "mongodb-atlas" || 
    config.type === "redis" || 
    tempPassword.length > 0 ||
    (config.type as string !== "sqlite" && config.type as string !== "mongodb-atlas" && config.type as string !== "redis")
  )
  
  const isValidForSave = !testOnly && validationStatus.valid && (testOnly || connectionTested)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif font-bold flex items-center gap-2">
          <Database className="h-5 w-5" />
          {testOnly ? "Test Database Connection" : (initialConfig ? "Edit Connection" : "Add Database Connection")}
        </CardTitle>
        <CardDescription>
          {testOnly ? "Test connection to any database without saving" : "Configure your database connection settings"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {!testOnly && (
            <div className="space-y-2">
              <Label htmlFor="name">Connection Name</Label>
              <Input
                id="name"
                placeholder="My Database"
                value={config.name}
                onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          )}
          <div className={`space-y-2 ${testOnly ? 'col-span-2' : ''}`}>
            <Label htmlFor="type">Database Type</Label>
            <Select value={config.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    PostgreSQL
                  </div>
                </SelectItem>
                <SelectItem value="mysql">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    MySQL
                  </div>
                </SelectItem>
                <SelectItem value="mongodb">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    MongoDB
                  </div>
                </SelectItem>
                <SelectItem value="mongodb-atlas">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    MongoDB Atlas
                  </div>
                </SelectItem>
                <SelectItem value="redis">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Redis
                  </div>
                </SelectItem>
                <SelectItem value="cassandra">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Cassandra
                  </div>
                </SelectItem>
                <SelectItem value="sqlite">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    SQLite
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auto-test toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="auto-test"
            checked={autoTestEnabled}
            onChange={(e) => setAutoTestEnabled(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="auto-test" className="text-sm">
            Auto-test connection when all fields are filled
          </Label>
        </div>

        {/* Type-specific form sections */}
        {config.type === "sqlite" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="my_database"
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqlite-file">SQLite File</Label>
              <div className="flex gap-2">
                <Input
                  id="sqlite-file"
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground self-center">or</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filename">File Path (Alternative)</Label>
              <Input
                id="filename"
                placeholder="/path/to/database.db"
                value={config.filename}
                onChange={(e) => setConfig((prev) => ({ ...prev, filename: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Provide file path if not uploading file above
              </p>
            </div>
          </div>
        ) : config.type === "mongodb-atlas" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connectionString">MongoDB Atlas Connection String</Label>
              <Textarea
                id="connectionString"
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
                value={config.connectionString}
                onChange={(e) => setConfig((prev) => ({ ...prev, connectionString: e.target.value }))}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Your complete MongoDB Atlas connection string including credentials and database name
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                placeholder="database_name"
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Database name (will be auto-extracted from connection string if available)
              </p>
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
                  placeholder={getDefaultPort(config.type as DatabaseType)?.toString() || ""}
                  value={config.port || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: Number.parseInt(e.target.value) || undefined }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">
                {config.type === "redis" ? "Database Index" : "Database Name"}
              </Label>
              <Input
                id="database"
                placeholder={config.type === "redis" ? "0" : "my_database"}
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
            </div>
            {config.type !== "redis" && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={config.username}
                  onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
            )}
            {(showPasswordField || authenticationRequired || testOnly) && (
              <div className="space-y-2">
                <Label htmlFor="temp-password">
                  Password {config.type === "redis" ? "(Optional)" : authenticationRequired ? "(Required)" : "(Optional)"}
                </Label>
                <Input
                  id="temp-password"
                  type="password"
                  placeholder={authenticationRequired ? "Password required for authentication" : "Enter password to test connection"}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {authenticationRequired 
                    ? "Authentication failed. Please provide password to continue."
                    : "Password will be encrypted and saved with the connection"
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Validation status */}
        {!validationStatus.valid && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>{validationStatus.message}</AlertDescription>
          </Alert>
        )}

        {/* Authentication required alert */}
        {authenticationRequired && (
          <Alert className="border-amber-200 bg-amber-50">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-600" />
              <div className="flex-1">
                <AlertDescription className="text-amber-800">
                  Connection failed due to authentication. Please provide your password below and try again.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Test result */}
        {testResult && (
          <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <div className="flex-1">
                <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                  {testResult.latency && (
                    <span className="ml-2 text-xs">
                      ({testResult.latency}ms)
                    </span>
                  )}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="outline" onClick={testConnection} disabled={!canTest || testing}>
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
          {!testOnly && (
            <Button onClick={handleSave} disabled={!isValidForSave}>
              {initialConfig ? "Update Connection" : "Save Connection"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
