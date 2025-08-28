"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  TableIcon,
  Key,
  Database,
  Eye,
  BarChart3,
  Columns,
  Hash,
  Calendar,
  Type,
  FileText,
  Code,
  Loader2,
  Users,
  Shield,
  Layers,
  HardDrive,
} from "lucide-react"
import type { DatabaseConfig, TableInfo } from "@/lib/database"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SchemaExplorerProps {
  database: DatabaseConfig
  onOpenQuery?: (query: string) => void
}

export function SchemaExplorer({ database, onOpenQuery }: SchemaExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null)
  const [activeTab, setActiveTab] = useState("structure")
  const [tables, setTables] = useState<TableInfo[]>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [apiColumns, setApiColumns] = useState<string[]>([]) // Store the actual column order from API
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const { toast } = useToast()

  const filteredTables = tables.filter((table) => table.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Load tables when component mounts or database changes
  useEffect(() => {
    loadTables()
  }, [database.id])

  // Load table data when selected table changes
  useEffect(() => {
    if (selectedTable && activeTab === "data") {
      loadTableData()
    } else {
      // Clear data when switching away from data tab or changing tables
      setTableData([])
      setApiColumns([])
    }
  }, [selectedTable, activeTab])

  const loadTables = async () => {
    try {
      setLoading(true)
      console.log("Loading tables for database:", database.id)
      const tablesData = await apiClient.getTables(database.id)
      console.log("Received tables:", tablesData)
      
      // Convert backend format to frontend format
      const convertedTables = tablesData.map(table => ({
        name: table.name,
        rowCount: table.row_count ?? 0, // Use nullish coalescing for safety
        columns: table.columns.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable ?? true, // Default to nullable for MongoDB
          primaryKey: col.primaryKey ?? false,
          defaultValue: col.defaultValue
        }))
      }))
      
      setTables(convertedTables)
    } catch (error) {
      console.error("Failed to load tables:", error)
      toast({
        title: "Error",
        description: `Failed to load database ${tableLabel.toLowerCase()}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTableData = async () => {
    if (!selectedTable) return
    
    try {
      setLoadingData(true)
      console.log("Loading data for table:", selectedTable.name)
      console.log("Database ID:", database.id)
      
      const data = await apiClient.getTableData(database.id, selectedTable.name, 10, 0)
      console.log("Received table data:", data)
      
      // Handle the actual API response format: { columns: [...], rows: [...], total_count: number, ... }
      if (data && data.rows && Array.isArray(data.rows)) {
        setTableData(data.rows)
        setApiColumns(data.columns || []) // Store the API column order
        console.log("Table data set to:", data.rows.length, "rows")
        console.log("Sample row data:", data.rows[0])
        console.log("API Columns:", data.columns)
        console.log("Selected table columns:", selectedTable.columns.map(c => c.name))
        
        // Verify column mapping
        if (data.columns && data.rows[0]) {
          console.log("Column mapping verification:")
          data.columns.forEach((col, index) => {
            console.log(`  ${col} (index ${index}): ${data.rows[0][index]}`)
          })
        }
      } else if (data && Array.isArray(data)) {
        setTableData(data)
        console.log("Table data set to:", data.length, "rows (direct array)")
      } else {
        console.warn("Unexpected data format:", data)
        console.log("Data keys:", data ? Object.keys(data) : "data is null/undefined")
        setTableData([])
        toast({
          title: "Warning",
          description: "No data found for this table",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Failed to load table data:", error)
      toast({
        title: "Error",
        description: `Failed to load data for ${tableSingular} ${selectedTable.name}`,
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const getColumnIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("int") || lowerType.includes("number")) return <Hash className="h-4 w-4 text-blue-500" />
    if (lowerType.includes("varchar") || lowerType.includes("text")) return <Type className="h-4 w-4 text-green-500" />
    if (lowerType.includes("timestamp") || lowerType.includes("date"))
      return <Calendar className="h-4 w-4 text-purple-500" />
    if (lowerType.includes("decimal") || lowerType.includes("float"))
      return <BarChart3 className="h-4 w-4 text-orange-500" />
    // MongoDB specific types
    if (lowerType === "objectid") return <Hash className="h-4 w-4 text-red-500" />
    if (lowerType === "array") return <Layers className="h-4 w-4 text-indigo-500" />
    if (lowerType === "object") return <FileText className="h-4 w-4 text-cyan-500" />
    if (lowerType === "boolean") return <Shield className="h-4 w-4 text-yellow-500" />
    return <FileText className="h-4 w-4 text-gray-500" />
  }

  const getColumnTypeColor = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes("int") || lowerType.includes("number"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    if (lowerType.includes("varchar") || lowerType.includes("text"))
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (lowerType.includes("timestamp") || lowerType.includes("date"))
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    if (lowerType.includes("decimal") || lowerType.includes("float"))
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    // MongoDB specific types
    if (lowerType === "objectid") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (lowerType === "array") return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
    if (lowerType === "object") return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
    if (lowerType === "boolean") return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return <span className="text-muted-foreground italic">NULL</span>
    
    // Handle MongoDB ObjectId
    if (typeof value === "string" && value.length === 24 && /^[0-9a-fA-F]{24}$/.test(value)) {
      return <span className="font-mono text-xs text-red-600 dark:text-red-400">{value}</span>
    }
    
    // Handle dates (both ISO strings and Date objects)
    if (typeof value === "string" && (value.includes("T") && value.includes("Z"))) {
      return <span className="text-purple-600 dark:text-purple-400">{new Date(value).toLocaleString()}</span>
    }
    if (value instanceof Date) {
      return <span className="text-purple-600 dark:text-purple-400">{value.toLocaleString()}</span>
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground italic">[]</span>
      if (value.length <= 3) {
        return <span className="text-indigo-600 dark:text-indigo-400">[{value.map(v => String(v)).join(", ")}]</span>
      }
      return <span className="text-indigo-600 dark:text-indigo-400">[{value.length} items]</span>
    }
    
    // Handle objects
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value)
      if (keys.length === 0) return <span className="text-muted-foreground italic">{"{}"}</span>
      if (keys.length <= 3) {
        return <span className="text-cyan-600 dark:text-cyan-400">{"{" + keys.join(", ") + "}"}</span>
      }
      return <span className="text-cyan-600 dark:text-cyan-400">{"{" + keys.length + " fields}"}</span>
    }
    
    // Handle booleans
    if (typeof value === "boolean") {
      return <span className={`font-medium ${value ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
        {value ? "true" : "false"}
      </span>
    }
    
    // Handle numbers
    if (typeof value === "number") {
      return <span className="text-blue-600 dark:text-blue-400">{value.toLocaleString()}</span>
    }
    
    // Default string handling
    return <span className="text-gray-900 dark:text-gray-100">{String(value)}</span>
  }

  const handleQueryTable = (tableName: string) => {
    // Generate appropriate query based on database type
    let query: string
    
    if (database.type === "mongodb" || database.type === "mongodb-atlas") {
      // MongoDB query
      query = `db.${tableName}.find({}).limit(10)`
    } else {
      // SQL query for other database types
      query = `SELECT * FROM ${tableName} LIMIT 10;`
    }
    
    onOpenQuery?.(query)
  }

  // Get appropriate terminology based on database type
  const isMongoDb = database.type === "mongodb" || database.type === "mongodb-atlas"
  const tableLabel = isMongoDb ? "Collections" : "Tables"
  const tableSingular = isMongoDb ? "collection" : "table"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
      {/* Tables Sidebar */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif font-bold flex items-center gap-2">
              <Database className="h-5 w-5" />
              {tableLabel} ({filteredTables.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${tableLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
                      <ScrollArea className="h-[calc(100vh-14rem)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading {tableLabel.toLowerCase()}...</span>
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="space-y-1 p-4">
                {filteredTables.map((table) => (
                  <Button
                    key={table.name}
                    variant={selectedTable?.name === table.name ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedTable(table)}
                  >
                    <TableIcon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{table.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {(table.rowCount || 0).toLocaleString()} rows
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {tableLabel.toLowerCase()} found</p>
              </div>
            )}
          </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Table Details */}
      <div className="lg:col-span-3">
        {selectedTable ? (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-serif font-bold flex items-center gap-2">
                    <TableIcon className="h-5 w-5" />
                    {selectedTable.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedTable.columns.length} {isMongoDb ? "fields" : "columns"} • {(selectedTable.rowCount ?? 0).toLocaleString()} {isMongoDb ? "documents" : "rows"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                    onClick={() => handleQueryTable(selectedTable.name)}
                  >
                    <Code className="h-4 w-4" />
                    Query
                  </Button>
                  {/* <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <BarChart3 className="h-4 w-4" />
                    Analyze
                  </Button> */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="structure" className="gap-2">
                    <Columns className="h-4 w-4" />
                    {isMongoDb ? "Schema" : "Structure"}
                  </TabsTrigger>
                  <TabsTrigger value="data" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Data Preview
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="structure" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isMongoDb ? "Field" : "Column"}</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Constraints</TableHead>
                          <TableHead>Default</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedTable.columns.map((column) => (
                          <TableRow key={column.name}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getColumnIcon(column.type)}
                                <span className="font-medium">{column.name}</span>
                                {column.primaryKey && <Key className="h-3 w-3 text-yellow-500" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getColumnTypeColor(column.type)}>{column.type}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {column.primaryKey && <Badge variant="outline">PRIMARY KEY</Badge>}
                                {!column.nullable && <Badge variant="outline">NOT NULL</Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-muted-foreground">
                                {column.defaultValue || <span className="italic">None</span>}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="data" className="mt-4">
                  <ScrollArea className="h-[calc(100vh-20rem)] w-full" isBothVH={true}>
                    <div className="min-w-full">
                    {loadingData ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading {tableSingular} data...</span>
                      </div>
                    ) : tableData.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {apiColumns.length > 0 ? (
                              apiColumns.map((columnName) => (
                                <TableHead key={columnName} className="whitespace-nowrap min-w-[120px]">{columnName}</TableHead>
                              ))
                            ) : (
                              selectedTable.columns.map((column) => (
                                <TableHead key={column.name} className="whitespace-nowrap min-w-[120px]">{column.name}</TableHead>
                              ))
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tableData.map((row, index) => (
                            <TableRow key={index}>
                              {apiColumns.length > 0 ? (
                                apiColumns.map((columnName, columnIndex) => (
                                  <TableCell key={columnName} className="whitespace-nowrap min-w-[120px]">
                                    {formatValue(Array.isArray(row) ? row[columnIndex] : row[columnName])}
                                  </TableCell>
                                ))
                              ) : (
                                selectedTable.columns.map((column, columnIndex) => (
                                  <TableCell key={column.name} className="whitespace-nowrap min-w-[120px]">
                                    {formatValue(Array.isArray(row) ? row[columnIndex] : row[column.name])}
                                  </TableCell>
                                ))
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No data available for this {tableSingular}</p>
                      </div>
                    )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="stats" className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Total {isMongoDb ? "Documents" : "Rows"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{(selectedTable.rowCount ?? 0).toLocaleString()}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Columns className="h-4 w-4 text-green-500" />
                          {isMongoDb ? "Fields" : "Columns"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedTable.columns.length}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Key className="h-4 w-4 text-yellow-500" />
                          Primary Keys
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTable.columns.filter((col) => col.primaryKey).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4 text-purple-500" />
                          Nullable {isMongoDb ? "Fields" : "Columns"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedTable.columns.filter((col) => col.nullable).length}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Layers className="h-4 w-4 text-orange-500" />
                          Data Types
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {new Set(selectedTable.columns.map((col) => col.type.split("(")[0])).size}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-red-500" />
                          Estimated Size
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(((selectedTable.rowCount ?? 0) * selectedTable.columns.length * 50) / 1024 / 1024).toFixed(1)} MB
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="font-serif font-bold mb-2">Select a {tableSingular}</CardTitle>
              <CardDescription>Choose a {tableSingular} from the sidebar to explore its structure and data</CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
