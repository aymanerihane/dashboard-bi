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
import { Database, Code, BarChart3, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { DatabaseService, type DatabaseConfig } from "@/lib/database"

export default function DatabaseDashboard() {
  const { isAuthenticated, isLoading } = useAuth()
  const [connections, setConnections] = useState<DatabaseConfig[]>([])
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseConfig | null>(null)
  const [activeTab, setActiveTab] = useState("explorer")
  const [queryToLoad, setQueryToLoad] = useState<string>("")
  const [loadingConnections, setLoadingConnections] = useState(false)

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

  const handleConnect = (connection: DatabaseConfig) => {
    setSelectedDatabase(connection)
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
                    onClick={() => setSelectedDatabase(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to Connections
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
              <DashboardVisualization database={selectedDatabase} />
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
    </div>
  )
}
