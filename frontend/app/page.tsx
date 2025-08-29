"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionManager } from "@/components/connection-manager"
import { SchemaExplorer } from "@/components/schema-explorer"
import { QueryInterface } from "@/components/query-interface"
import { DashboardVisualization } from "@/components/dashboard-visualization"
import { DatabaseConnectionTest } from "@/components/database-connection-test"
import { AuthPage } from "@/components/auth/auth-page"
import { UserMenu } from "@/components/user-menu"
import { PasswordConfirmationDialog } from "@/components/password-dialog"
import { Database, Code, BarChart3, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useDatabaseConnection } from "@/contexts/database-connection-context"
import { DatabaseService, type DatabaseConfig } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"

export default function DatabaseDashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const { toast } = useToast()
  const { 
    passwordState,
    requestConnection,
    closePasswordDialog,
    savePassword: savePasswordToStorage
  } = useDatabaseConnection()
  const [connections, setConnections] = useState<DatabaseConfig[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseConfig | null>(null)
  const [activeTab, setActiveTab] = useState("explorer")
  const [queryToLoad, setQueryToLoad] = useState<string>("")
  const [loadingConnections, setLoadingConnections] = useState(false)
  const [connectingToDatabase, setConnectingToDatabase] = useState(false)

  const databaseService = DatabaseService.getInstance()

  // Load connections when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadConnections()
    }
  }, [isAuthenticated])

  const loadConnections = async () => {
    try {
      setLoadingConnections(true)
      const databases = await databaseService.getDatabases()
      setConnections(databases)
    } catch (error) {
      console.error("Failed to load connections:", error)
    } finally {
      setLoadingConnections(false)
    }
  }

  const handleConnect = async (connection: DatabaseConfig) => {
    try {
      // Use the password confirmation flow (don't set loading state yet)
      requestConnection(connection, async (password: string, savePassword?: boolean) => {
        try {
          setConnectingToDatabase(true) // Set loading only when starting actual connection
          
          // Connect using the password verification endpoint
          const connectResult = await databaseService.connectWithPassword(connection.id, password)

          if (connectResult.success) {
            setSelectedDatabase(connection)
            
            // For SQLite and MongoDB Atlas, automatically go to schema explorer tab
            if (connection.type === "sqlite" || connection.type === "mongodb-atlas") {
              setActiveTab("explorer")
            }
            
            // Save password if requested
            if (savePassword) {
         }
            
            toast({
              title: "Success",
              description: `Connected to ${connection.name}`,
            })
          } else {
            toast({
              title: "Connection Failed",
              description: connectResult.message || "Failed to connect to database",
              variant: "destructive",
            })
          }
        } catch (error) {
          console.error("Connection error:", error)
          toast({
            title: "Error",
            description: "Failed to connect to database",
            variant: "destructive",
          })
        } finally {
          setConnectingToDatabase(false)
          closePasswordDialog()
        }
      })
    } catch (error) {
      console.error("Connection error:", error)
      toast({
        title: "Error",
        description: "Failed to initiate connection",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    setSelectedDatabase(null)
    toast({
      title: "Disconnected",
      description: "Successfully disconnected from database",
    })
  }

  const handleOpenQuery = (query: string) => {
    setQueryToLoad(query)
    setActiveTab("query")
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-black text-foreground">Database Dashboard</h1>
              <p className="text-muted-foreground">Manage and visualize your databases</p>
            </div>
            <div className="flex items-center gap-4">
              {selectedDatabase && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{selectedDatabase.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedDatabase.database}</p>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors flex items-center gap-1"
                  >
                    <Database className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {!selectedDatabase ? (
          <Tabs defaultValue="manager" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="manager">Connection Manager</TabsTrigger>
              <TabsTrigger value="test">Connection Test</TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboards
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manager" className="mt-6">
              <ConnectionManager connections={connections} onConnectionsChange={setConnections} onConnect={handleConnect} />
            </TabsContent>
            
            <TabsContent value="test" className="mt-6">
              <DatabaseConnectionTest />
            </TabsContent>
            
            <TabsContent value="dashboard" className="mt-6">
              <DashboardVisualization database={selectedDatabase || undefined} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-lg">
              <TabsTrigger value="explorer" className="gap-2">
                <Database className="h-4 w-4" />
                Schema Explorer
              </TabsTrigger>
              <TabsTrigger value="query" className="gap-2">
                <Code className="h-4 w-4" />
                Query Interface
              </TabsTrigger>
            </TabsList>

            <TabsContent value="explorer" className="space-y-6">
              <SchemaExplorer database={selectedDatabase} onOpenQuery={handleOpenQuery} />
            </TabsContent>

            <TabsContent value="query" className="space-y-6">
              <QueryInterface database={selectedDatabase} />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Password Confirmation Dialog */}
      <PasswordConfirmationDialog
        open={passwordState.showPasswordDialog}
        onOpenChange={(open) => !open && closePasswordDialog()}
        databaseName={passwordState.selectedDatabase?.name || ""}
        onConfirm={(password, savePassword) => {
          if (passwordState.onConfirmCallback) {
            passwordState.onConfirmCallback(password, savePassword)
          }
        }}
        onCancel={closePasswordDialog}
        loading={connectingToDatabase}
      />
    </div>
  )
}
