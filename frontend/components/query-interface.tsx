"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Play,
  Save,
  Download,
  History,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Copy,
} from "lucide-react"
import type { DatabaseConfig, QueryResult } from "@/lib/database"
import { apiClient } from "@/lib/api"

interface QueryInterfaceProps {
  database: DatabaseConfig
}

interface QueryHistoryItem {
  id: string
  query: string
  timestamp: Date
  executionTime: number
  status: "success" | "error"
  rowCount?: number
  error?: string
}

// Mock query templates
const queryTemplates = {
  postgresql: [
    {
      name: "Select All Users",
      query: "SELECT * FROM users LIMIT 10;",
      description: "Get first 10 users from the users table",
    },
    {
      name: "User Count by Date",
      query:
        "SELECT DATE(created_at) as date, COUNT(*) as user_count\nFROM users\nGROUP BY DATE(created_at)\nORDER BY date DESC;",
      description: "Count users grouped by registration date",
    },
    {
      name: "Recent Orders",
      query:
        "SELECT o.id, u.name, o.total, o.status, o.created_at\nFROM orders o\nJOIN users u ON o.user_id = u.id\nWHERE o.created_at >= NOW() - INTERVAL '7 days'\nORDER BY o.created_at DESC;",
      description: "Get orders from the last 7 days with user information",
    },
  ],
  mysql: [
    {
      name: "Product Catalog",
      query: "SELECT * FROM products ORDER BY price DESC LIMIT 20;",
      description: "Get top 20 most expensive products",
    },
    {
      name: "Average Price by Category",
      query:
        "SELECT category_id, AVG(price) as avg_price, COUNT(*) as product_count\nFROM products\nGROUP BY category_id\nORDER BY avg_price DESC;",
      description: "Calculate average price per category",
    },
  ],
  sqlite: [
    {
      name: "Recent Logs",
      query: "SELECT * FROM logs WHERE timestamp >= datetime('now', '-1 hour') ORDER BY timestamp DESC;",
      description: "Get logs from the last hour",
    },
    {
      name: "Log Level Summary",
      query: "SELECT level, COUNT(*) as count\nFROM logs\nGROUP BY level\nORDER BY count DESC;",
      description: "Count logs by severity level",
    },
  ],
  mongodb: [
    {
      name: "Find All Documents",
      query: "db.collection.find().limit(10)",
      description: "Get first 10 documents from a collection",
    },
    {
      name: "Count by Status",
      query: "db.collection.aggregate([{$group: {_id: '$status', count: {$sum: 1}}}])",
      description: "Count documents grouped by status field",
    },
  ],
  "mongodb-atlas": [
    {
      name: "Find Recent Records",
      query: "db.collection.find({createdAt: {$gte: new Date(Date.now() - 7*24*60*60*1000)}}).sort({createdAt: -1})",
      description: "Find records from the last 7 days",
    },
  ],
  redis: [
    {
      name: "Get Key Info",
      query: "INFO keyspace",
      description: "Get information about keyspaces",
    },
    {
      name: "List Keys",
      query: "KEYS *",
      description: "List all keys (use with caution in production)",
    },
  ],
  cassandra: [
    {
      name: "Select from Table",
      query: "SELECT * FROM keyspace.table LIMIT 10;",
      description: "Get first 10 rows from a table",
    },
  ],
}

// Mock query results
const mockQueryResults: Record<string, QueryResult> = {
  "SELECT * FROM users LIMIT 10;": {
    columns: ["id", "email", "name", "created_at"],
    rows: [
      [1, "john@example.com", "John Doe", "2024-01-15T10:30:00Z"],
      [2, "jane@example.com", "Jane Smith", "2024-01-16T14:22:00Z"],
      [3, "bob@example.com", "Bob Johnson", "2024-01-17T09:15:00Z"],
    ],
    rowCount: 3,
    executionTime: 45,
  },
  "SELECT * FROM products ORDER BY price DESC LIMIT 20;": {
    columns: ["id", "name", "price", "category_id"],
    rows: [
      [1, "Laptop Pro", 1299.99, 1],
      [2, "Wireless Mouse", 29.99, 2],
      [3, "USB-C Cable", 19.99, 2],
    ],
    rowCount: 3,
    executionTime: 32,
  },
}

export function QueryInterface({ database }: QueryInterfaceProps) {
  const [query, setQuery] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([])

  // Helper function to reload query history
  const reloadQueryHistory = async () => {
    try {
      const historyData = await apiClient.getQueryHistory(10)
      setQueryHistory(historyData.map(item => ({
        id: item.id.toString(),
        query: item.query,
        timestamp: new Date(item.executed_at),
        executionTime: item.execution_time,
        status: item.status as 'success' | 'error',
        rowCount: item.row_count,
        error: item.error_message
      })))
    } catch (error) {
      console.error('Failed to load query history:', error)
    }
  }

  // Load query history from API on component mount
  useEffect(() => {
    reloadQueryHistory()
  }, [database?.name])

  const templates = queryTemplates[database.type] || []

  const executeQuery = async () => {
    if (!query.trim()) return

    setIsExecuting(true)
    setQueryError(null)
    setQueryResult(null)

    try {
      const startTime = Date.now()
      const result = await apiClient.executeQuery(database.id, query.trim())
      const executionTime = Date.now() - startTime

      if (result.success && result.data) {
        const queryResult: QueryResult = {
          columns: result.columns?.map((col: any) => col.name) || [],
          rows: result.data.map((row: any) => Object.values(row)),
          rowCount: result.data.length,
          executionTime,
        }

        setQueryResult(queryResult)

        // Reload query history to show the latest execution
        await reloadQueryHistory()

      } else {
        const errorMessage = result.error || "Query execution failed"
        setQueryError(errorMessage)

        // Reload query history to show the latest execution
        await reloadQueryHistory()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Query execution failed"
      setQueryError(errorMessage)

      // Reload query history in case the error was logged
      await reloadQueryHistory()
    }

    setIsExecuting(false)
  }

  const loadTemplate = (template: { query: string }) => {
    setQuery(template.query)
    setQueryResult(null)
    setQueryError(null)
  }

  const loadFromHistory = (historyItem: QueryHistoryItem) => {
    setQuery(historyItem.query)
    setQueryResult(null)
    setQueryError(null)
  }

  const exportResults = () => {
    if (!queryResult) return

    const csv = [
      queryResult.columns.join(","),
      ...queryResult.rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "query_results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Query Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif font-bold">SQL Query Editor</CardTitle>
                  <CardDescription>Write and execute SQL queries against {database.name}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <BookOpen className="h-4 w-4" />
                        Templates
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      {templates.map((template, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => loadTemplate(template)}
                          className="flex-col items-start p-3"
                        >
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Enter your SQL query here..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">{query.length} characters</div>
                  <Button onClick={executeQuery} disabled={!query.trim() || isExecuting} className="gap-2">
                    {isExecuting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Execute Query
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Query History */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif font-bold flex items-center gap-2">
                <History className="h-5 w-5" />
                Query History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 p-4">
                  {queryHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Badge variant={item.status === "success" ? "secondary" : "destructive"}>{item.status}</Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.executionTime}ms
                        </div>
                      </div>
                      <div className="text-xs font-mono bg-muted p-2 rounded truncate">{item.query}</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatTimestamp(item.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Query Results */}
      {(queryResult || queryError) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif font-bold">Query Results</CardTitle>
                {queryResult && (
                  <CardDescription>
                    {queryResult.rowCount} rows returned in {queryResult.executionTime}ms
                  </CardDescription>
                )}
              </div>
              {queryResult && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportResults} className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {queryError ? (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Query Error:</strong> {queryError}
                </AlertDescription>
              </Alert>
            ) : queryResult ? (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {queryResult.columns.map((column) => (
                        <TableHead key={column} className="font-medium">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queryResult.rows.map((row, index) => (
                      <TableRow key={index}>
                        {row.map((cell: any, cellIndex: number) => (
                          <TableCell key={cellIndex}>
                            {cell === null || cell === undefined ? (
                              <span className="text-muted-foreground italic">NULL</span>
                            ) : typeof cell === "string" && cell.includes("T") && cell.includes("Z") ? (
                              new Date(cell).toLocaleString()
                            ) : (
                              String(cell)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
