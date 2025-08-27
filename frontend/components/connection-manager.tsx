"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Database, Server, HardDrive, Plus, MoreVertical, Edit, Trash2, Play, Loader2 } from "lucide-react"
import { ConnectionForm } from "./connection-form"
import { PasswordPrompt } from "./password-prompt"
import { DatabaseService, type DatabaseConfig } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

interface ConnectionManagerProps {
  connections: DatabaseConfig[]
  onConnectionsChange: (connections: DatabaseConfig[]) => void
  onConnect: (connection: DatabaseConfig) => void
}

export function ConnectionManager({ connections, onConnectionsChange, onConnect }: ConnectionManagerProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingConnection, setEditingConnection] = useState<DatabaseConfig | null>(null)
  const [deletingConnection, setDeletingConnection] = useState<DatabaseConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState<number | null>(null)
  const [passwordPrompt, setPasswordPrompt] = useState<{
    connection: DatabaseConfig
    error?: string
  } | null>(null)
  const { toast } = useToast()
  const databaseService = DatabaseService.getInstance()

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setIsLoading(true)
      const databases = await databaseService.getDatabases()
      onConnectionsChange(databases)
    } catch (error) {
      console.error("Failed to load connections:", error)
      toast({
        title: "Error",
        description: "Failed to load database connections",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case "postgresql":
        return <Database className="h-5 w-5 text-blue-600" />
      case "mysql":
        return <Server className="h-5 w-5 text-orange-600" />
      case "sqlite":
        return <HardDrive className="h-5 w-5 text-green-600" />
      default:
        return <Database className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "postgresql":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "mysql":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "sqlite":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const handleSaveConnection = async (config: DatabaseConfig) => {
    try {
      setIsLoading(true)

      if (editingConnection) {
        await databaseService.updateDatabase(editingConnection.id, config)
        toast({
          title: "Success",
          description: "Database connection updated successfully",
        })
      } else {
        await databaseService.createDatabase(config)
        toast({
          title: "Success",
          description: "Database connection created successfully",
        })
      }

      await loadConnections()
      setShowForm(false)
      setEditingConnection(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save connection",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditConnection = (connection: DatabaseConfig) => {
    setEditingConnection(connection)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!deletingConnection) return

    try {
      await databaseService.deleteDatabase(deletingConnection.id)
      await loadConnections()
      toast({
        title: "Success",
        description: "Database connection deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete connection:", error)
      toast({
        title: "Error",
        description: "Failed to delete connection",
        variant: "destructive",
      })
    } finally {
      setDeletingConnection(null)
    }
  }

  const handleConnectClick = async (connection: DatabaseConfig) => {
    // For SQLite, connect directly
    if (connection.type === "sqlite") {
      onConnect(connection)
      return
    }

    // For PostgreSQL/MySQL, try to connect first with stored credentials
    try {
      setTestingConnection(connection.id)
      
      // First, try a regular connection (backend should have stored password)
      const result = await databaseService.testConnection(connection.id)
      
      if (result.success) {
        onConnect(connection)
        toast({
          title: "Connected",
          description: `Successfully connected to ${connection.name}`,
        })
      } else {
        // Only show password prompt if connection fails (password needed)
        setPasswordPrompt({ connection, error: result.message })
      }
    } catch (error) {
      // Connection error, show password prompt
      setPasswordPrompt({ 
        connection, 
        error: error instanceof Error ? error.message : "Connection failed - password may be required" 
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordPrompt) return

    try {
      // Use the connectWithPassword method to establish connection with provided password
      const result = await databaseService.connectWithPassword(passwordPrompt.connection.id, password)
      if (result.success) {
        setPasswordPrompt(null)
        onConnect(passwordPrompt.connection)
        toast({
          title: "Success",
          description: "Connected successfully with provided password",
        })
      } else {
        // Update error in password prompt
        setPasswordPrompt({
          ...passwordPrompt,
          error: result.message || "Invalid password or connection failed"
        })
      }
    } catch (error) {
      setPasswordPrompt({
        ...passwordPrompt,
        error: error instanceof Error ? error.message : "Connection failed"
      })
    }
  }

  const handleTestConnection = async (connection: DatabaseConfig) => {
    try {
      setTestingConnection(connection.id)
      const result = await databaseService.testConnection(connection.id)

      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected in ${result.latency}ms`,
        })
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(null)
    }
  }

  const handleAddNew = () => {
    setEditingConnection(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold mb-2">Database Connections</h2>
          <p className="text-muted-foreground">Manage your database connections</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Connection
        </Button>
      </div>

      {isLoading && connections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <CardTitle className="font-serif font-bold mb-2">Loading Connections</CardTitle>
            <CardDescription>Please wait while we load your database connections...</CardDescription>
          </CardContent>
        </Card>
      ) : connections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="font-serif font-bold mb-2">No Connections</CardTitle>
            <CardDescription className="mb-4">Add your first database connection to get started</CardDescription>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getDatabaseIcon(connection.type)}
                    <div>
                      <CardTitle className="text-lg font-serif font-bold">{connection.name}</CardTitle>
                      <CardDescription className="text-sm">{connection.database}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(connection.type)}>{connection.type.toUpperCase()}</Badge>
                    {connection.status && (
                      <Badge variant={connection.status === "connected" ? "default" : "secondary"}>
                        {connection.status}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isLoading}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTestConnection(connection)}>
                          {testingConnection === connection.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Test Connection
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditConnection(connection)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingConnection(connection)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  {connection.host && (
                    <p>
                      Host: {connection.host}:{connection.port}
                    </p>
                  )}
                  {connection.filename && <p>File: {connection.filename}</p>}
                  {connection.username && <p>User: {connection.username}</p>}
                  {connection.createdAt && <p>Created: {connection.createdAt.toLocaleDateString()}</p>}
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => handleConnectClick(connection)}
                  disabled={isLoading || testingConnection === connection.id}
                >
                  {testingConnection === connection.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Connect & Explore
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{editingConnection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          </DialogHeader>
          <ConnectionForm
            initialConfig={editingConnection || undefined}
            onSave={handleSaveConnection}
            onCancel={() => {
              setShowForm(false)
              setEditingConnection(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingConnection} onOpenChange={() => setDeletingConnection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the connection "{deletingConnection?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingConnection && handleDelete()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PasswordPrompt
        isOpen={passwordPrompt !== null}
        onClose={() => setPasswordPrompt(null)}
        onSubmit={handlePasswordSubmit}
        connectionName={passwordPrompt?.connection.name || ""}
        error={passwordPrompt?.error}
      />
    </div>
  )
}
