"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { BarChart3, LineChartIcon, PieChartIcon, TrendingUp, Plus, Settings, Save, Trash2, Grid3X3, Edit, Move, Maximize, Minimize, Palette } from "lucide-react"
import type { DatabaseConfig, TableInfo, ColumnInfo } from "@/lib/database"
import { apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Responsive, WidthProvider } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import "../styles/grid-layout.css"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardVisualizationProps {
  database?: DatabaseConfig
}

interface ChartConfig {
  id: string
  title: string
  type: "bar" | "line" | "pie" | "area" | "scatter" | "histogram" | "heatmap" | "donut"
  query: string
  xAxis?: string
  yAxis?: string
  data: any[]
  color: string
  width?: number  // Chart width in grid units
  height?: number // Chart height in grid units
  position?: number // Position in the grid (for ordering)
  x?: number      // X position in grid
  y?: number      // Y position in grid
  w?: number      // Width in grid units (for react-grid-layout)
  h?: number      // Height in grid units (for react-grid-layout)
  columns?: { [key: string]: string } // Column name mappings for custom labels
  customColors?: { [key: string]: string } // Custom color mappings for data series
}

interface Dashboard {
  id: string
  name: string
  description: string
  charts: ChartConfig[]
  createdAt: Date
}

// Mock chart data
const mockChartData = {
  userGrowth: [
    { month: "Jan", users: 1200, revenue: 45000 },
    { month: "Feb", users: 1350, revenue: 52000 },
    { month: "Mar", users: 1580, revenue: 61000 },
    { month: "Apr", users: 1720, revenue: 68000 },
    { month: "May", users: 1950, revenue: 75000 },
    { month: "Jun", users: 2100, revenue: 82000 },
  ],
  orderStatus: [
    { name: "Completed", value: 65, color: "#10b981" },
    { name: "Pending", value: 25, color: "#f59e0b" },
    { name: "Cancelled", value: 10, color: "#ef4444" },
  ],
  productCategories: [
    { category: "Electronics", sales: 45000, orders: 320 },
    { category: "Clothing", sales: 32000, orders: 280 },
    { category: "Books", sales: 18000, orders: 150 },
    { category: "Home", sales: 28000, orders: 200 },
    { category: "Sports", sales: 22000, orders: 180 },
  ],
  dailyActivity: [
    { day: "Mon", queries: 45, connections: 12 },
    { day: "Tue", queries: 52, connections: 15 },
    { day: "Wed", queries: 38, connections: 8 },
    { day: "Thu", queries: 61, connections: 18 },
    { day: "Fri", queries: 55, connections: 14 },
    { day: "Sat", queries: 28, connections: 6 },
    { day: "Sun", queries: 22, connections: 4 },
  ],
}

const chartColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16"]

export function DashboardVisualization({ database }: DashboardVisualizationProps) {
  // State for dashboards and charts
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)
  const [showCreateChart, setShowCreateChart] = useState(false)
  const [showCreateDashboard, setShowCreateDashboard] = useState(false)
  const [showEditChart, setShowEditChart] = useState(false)
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [newChart, setNewChart] = useState<Partial<ChartConfig>>({
    title: "",
    type: "bar",
    query: "",
    color: chartColors[0],
  })
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" })
  
  // New state for dynamic form
  const [availableDatabases, setAvailableDatabases] = useState<DatabaseConfig[]>([])
  const [selectedChartDatabase, setSelectedChartDatabase] = useState<string>("")
  const [availableTables, setAvailableTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [availableColumns, setAvailableColumns] = useState<ColumnInfo[]>([])
  const [selectedXColumn, setSelectedXColumn] = useState<string>("")
  const [selectedYColumn, setSelectedYColumn] = useState<string>("")
  const [loadingTables, setLoadingTables] = useState(false)
  const { toast } = useToast()

  // Helper function to convert backend chart format to frontend format
  const convertBackendChartToFrontend = (backendChart: any): ChartConfig => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // Generate unique ID
      title: backendChart.title,
      type: backendChart.type,
      query: backendChart.query,
      xAxis: backendChart.config?.xAxis,
      yAxis: backendChart.config?.yAxis,
      data: backendChart.config?.data || [],
      color: backendChart.config?.color || chartColors[0],
      width: backendChart.config?.width || 1,
      height: backendChart.config?.height || 1,
      position: backendChart.config?.position || 0,
      // Grid layout properties
      x: backendChart.config?.x || 0,
      y: backendChart.config?.y || 0,
      w: backendChart.config?.w || 2,
      h: backendChart.config?.h || 2,
      columns: backendChart.config?.columns || {},
      customColors: backendChart.config?.customColors || {}
    }
  }

  // Helper function to convert backend dashboard format to frontend format
  const convertBackendDashboardToFrontend = (backendDashboard: any): Dashboard => {
    return {
      id: backendDashboard.id.toString(),
      name: backendDashboard.name,
      description: backendDashboard.description,
      charts: backendDashboard.charts?.map(convertBackendChartToFrontend) || [],
      createdAt: new Date(backendDashboard.created_at),
    }
  }

  // Load dashboards from API on component mount
  useEffect(() => {
    const loadDashboards = async () => {
      setLoading(true)
      try {
        const backendDashboards = await apiClient.getDashboards()
        const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
        setDashboards(frontendDashboards)
        
        // Select first dashboard if available
        if (frontendDashboards.length > 0) {
          setSelectedDashboard(frontendDashboards[0])
        }
      } catch (error) {
        console.error('Failed to load dashboards:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboards()
  }, []) // Remove database dependency to load dashboards immediately

  // Load available databases on component mount
  useEffect(() => {
    loadDatabases()
  }, [])

  // Load tables when database is selected
  useEffect(() => {
    if (selectedChartDatabase) {
      loadTables()
    }
  }, [selectedChartDatabase])

  // Load columns when table is selected
  useEffect(() => {
    if (selectedTable && availableTables.length > 0) {
      const table = availableTables.find(t => t.name === selectedTable)
      if (table) {
        setAvailableColumns(table.columns)
      }
    }
  }, [selectedTable, availableTables])

  // Reset column selections when chart type changes
  useEffect(() => {
    if (newChart.type) {
      // Clear column selections when chart type changes to force reselection
      setSelectedXColumn("")
      setSelectedYColumn("")
    }
  }, [newChart.type])

  const loadDatabases = async () => {
    try {
      const databases = await apiClient.getDatabases()
      setAvailableDatabases(databases)
    } catch (error) {
      console.error("Failed to load databases:", error)
      toast({
        title: "Error",
        description: "Failed to load databases",
        variant: "destructive",
      })
    }
  }

  const loadTables = async () => {
    if (!selectedChartDatabase) return
    
    try {
      setLoadingTables(true)
      const tables = await apiClient.getTables(selectedChartDatabase)
      setAvailableTables(tables)
    } catch (error) {
      console.error("Failed to load tables:", error)
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      })
    } finally {
      setLoadingTables(false)
    }
  }

  const generateQuery = () => {
    if (!selectedTable || !selectedXColumn || !selectedYColumn) return ""
    return `SELECT ${selectedXColumn}, ${selectedYColumn} FROM ${selectedTable} LIMIT 100`
  }

  // Chart type configuration
  interface ChartTypeConfig {
    label: string
    requiresNumericY?: boolean
    requiresCategoricalX?: boolean
    requiresNumericX?: boolean
    allowsDateX?: boolean
    noYAxis?: boolean
    singleValue?: boolean
  }

  const chartTypes: Record<string, ChartTypeConfig> = {
    bar: { label: "Bar Chart", requiresNumericY: true, requiresCategoricalX: true },
    line: { label: "Line Chart", requiresNumericY: true, allowsDateX: true },
    area: { label: "Area Chart", requiresNumericY: true, allowsDateX: true },
    pie: { label: "Pie Chart", requiresCategoricalX: true, noYAxis: true },
    donut: { label: "Donut Chart", requiresCategoricalX: true, noYAxis: true },
    scatter: { label: "Scatter Plot", requiresNumericY: true, requiresNumericX: true },
    histogram: { label: "Histogram", requiresNumericX: true, noYAxis: true },
    heatmap: { label: "Heatmap", requiresNumericY: true, requiresCategoricalX: true }
  }

  // Column type detection
  const isNumericType = (type: string) => {
    const numericTypes = ['int', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 'double', 'float', 'money', 'number']
    return numericTypes.some(numType => type.toLowerCase().includes(numType))
  }

  const isDateType = (type: string) => {
    const dateTypes = ['date', 'time', 'timestamp', 'datetime']
    return dateTypes.some(dateType => type.toLowerCase().includes(dateType))
  }

  const isCategoricalType = (type: string) => {
    const categoricalTypes = ['varchar', 'char', 'text', 'string', 'enum', 'boolean', 'bool']
    return categoricalTypes.some(catType => type.toLowerCase().includes(catType)) || isDateType(type)
  }

  // Filter columns based on chart type and axis
  const getCompatibleColumns = (axis: 'x' | 'y') => {
    if (!newChart.type || !availableColumns.length) return availableColumns

    const chartConfig = chartTypes[newChart.type as keyof typeof chartTypes]
    if (!chartConfig) return availableColumns

    if (axis === 'x') {
      if (chartConfig.requiresCategoricalX) {
        return availableColumns.filter(col => isCategoricalType(col.type))
      }
      if (chartConfig.requiresNumericX) {
        return availableColumns.filter(col => isNumericType(col.type))
      }
      if (chartConfig.allowsDateX) {
        return availableColumns.filter(col => isDateType(col.type) || isNumericType(col.type) || isCategoricalType(col.type))
      }
      return availableColumns
    } else { // y axis
      if (chartConfig.noYAxis) {
        return []
      }
      if (chartConfig.requiresNumericY) {
        return availableColumns.filter(col => isNumericType(col.type))
      }
      return availableColumns
    }
  }

  // Get chart type description
  const getChartTypeDescription = (chartType: keyof typeof chartTypes) => {
    const descriptions = {
      bar: "Best for comparing categories. Requires categorical X-axis and numeric Y-axis.",
      line: "Perfect for trends over time. Supports dates, numbers, and categories on X-axis.",
      area: "Like line charts but with filled area. Great for showing volumes over time.",
      pie: "Shows proportions of a whole. Requires categorical labels and numeric values.",
      donut: "Similar to pie chart with a center hole. Good for highlighting totals.",
      scatter: "Shows correlation between two numeric variables. Both axes must be numeric.",
      histogram: "Shows distribution of a single numeric variable. Only X-axis needed.",
      heatmap: "Shows relationships between categorical variables with color intensity."
    }
    return descriptions[chartType] || "Select a chart type to see description."
  }

  // Get dynamic axis labels
  const getAxisLabel = (axis: 'x' | 'y', chartType: keyof typeof chartTypes) => {
    if (axis === 'x') {
      switch (chartType) {
        case 'histogram': return 'Variable Column'
        case 'pie':
        case 'donut': return 'Category Column'
        case 'scatter': return 'X-Axis (Numeric)'
        default: return 'X-Axis Column'
      }
    } else {
      switch (chartType) {
        case 'pie':
        case 'donut': return 'Value Column'
        case 'scatter': return 'Y-Axis (Numeric)'
        default: return 'Y-Axis Column'
      }
    }
  }

  // Get dynamic axis placeholders
  const getAxisPlaceholder = (axis: 'x' | 'y', chartType: keyof typeof chartTypes) => {
    if (axis === 'x') {
      switch (chartType) {
        case 'histogram': return 'Select numeric column'
        case 'pie':
        case 'donut': return 'Select category column'
        case 'scatter': return 'Select X numeric column'
        case 'bar': return 'Select category column'
        case 'line':
        case 'area': return 'Select date/time column'
        default: return 'Select X column'
      }
    } else {
      switch (chartType) {
        case 'pie':
        case 'donut': return 'Select value column'
        case 'scatter': return 'Select Y numeric column'
        default: return 'Select numeric column'
      }
    }
  }

  const renderChart = (chart: ChartConfig) => {
    // Check if data exists and is valid
    if (!chart.data || chart.data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available for this chart</p>
        </div>
      )
    }

    // Helper function to get display name for columns
    const getColumnDisplayName = (columnName: string) => {
      return chart.columns?.[columnName] || columnName
    }

    // Helper function to get custom color for data series
    const getSeriesColor = (seriesName: string, defaultColor: string) => {
      return chart.customColors?.[seriesName] || defaultColor
    }

    const commonProps = {
      width: "100%",
      height: 300,
      data: chart.data,
    }

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} 
                label={{ value: getColumnDisplayName(chart.xAxis || Object.keys(chart.data[0] || {})[0]), position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: getColumnDisplayName(chart.yAxis || Object.keys(chart.data[0] || {})[1]), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => getColumnDisplayName(chart.xAxis || Object.keys(chart.data[0] || {})[0]) + ': ' + value}
                formatter={(value, name) => [value, getColumnDisplayName(name as string)]}
              />
              <Legend formatter={(value) => getColumnDisplayName(value)} />
              <Bar 
                dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]} 
                fill={chart.color}
                name={getColumnDisplayName(chart.yAxis || Object.keys(chart.data[0] || {})[1])}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} 
                label={{ value: getColumnDisplayName(chart.xAxis || Object.keys(chart.data[0] || {})[0]), position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: getColumnDisplayName(chart.yAxis || Object.keys(chart.data[0] || {})[1]), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => getColumnDisplayName(chart.xAxis || Object.keys(chart.data[0] || {})[0]) + ': ' + value}
                formatter={(value, name) => [value, getColumnDisplayName(name as string)]}
              />
              <Legend formatter={(value) => getColumnDisplayName(value)} />
              <Line
                type="monotone"
                dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]}
                stroke={chart.color}
                strokeWidth={2}
                name={getColumnDisplayName(chart.yAxis || Object.keys(chart.data[0] || {})[1])}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]}
                stroke={chart.color}
                fill={chart.color}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chart.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getSeriesColor(entry.name, entry.color || chartColors[index % chartColors.length])} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, getColumnDisplayName(name as string)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case "donut":
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {chart.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getSeriesColor(entry.name, entry.color || chartColors[index % chartColors.length])} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, getColumnDisplayName(name as string)]}
              />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} type="number" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]}
                stroke={chart.color}
                strokeWidth={0}
                dot={{ fill: chart.color, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case "histogram":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill={chart.color} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "heatmap":
        return (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Heatmap visualization requires additional library integration</p>
          </div>
        )

      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Unsupported chart type: {chart.type}</p>
          </div>
        )
    }
  }

  // Get chart icon
  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar": return <BarChart3 className="h-4 w-4" />
      case "line": return <LineChartIcon className="h-4 w-4" />
      case "area": return <TrendingUp className="h-4 w-4" />
      case "pie": 
      case "donut": return <PieChartIcon className="h-4 w-4" />
      case "scatter": return <BarChart3 className="h-4 w-4" />
      case "histogram": return <BarChart3 className="h-4 w-4" />
      case "heatmap": return <Grid3X3 className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const createChart = async () => {
    const chartConfig = chartTypes[newChart.type as keyof typeof chartTypes]
    const needsYAxis = !chartConfig?.noYAxis
    
    if (!newChart.title || !selectedTable || !selectedXColumn || (needsYAxis && !selectedYColumn) || !selectedDashboard) return

    // Special handling for pie and donut charts - they need categorical data with counts
    let generatedQuery = ""
    if (newChart.type === "pie" || newChart.type === "donut") {
      generatedQuery = `SELECT ${selectedXColumn} as name, COUNT(*) as value FROM ${selectedTable} GROUP BY ${selectedXColumn} ORDER BY value DESC LIMIT 10`
    } else {
      generatedQuery = needsYAxis 
        ? `SELECT ${selectedXColumn}, ${selectedYColumn} FROM ${selectedTable} LIMIT 100`
        : `SELECT ${selectedXColumn} FROM ${selectedTable} LIMIT 100`
    }
    
    try {
      // Execute the query to get real data
      let chartData = []
      if (selectedChartDatabase) {
        console.log("Executing query:", generatedQuery)
        console.log("Database ID:", selectedChartDatabase)
        
        const result = await apiClient.executeQuery(selectedChartDatabase, generatedQuery)
        console.log("Query result:", result)
        
        if (result.success && result.data) {
          chartData = result.data
          console.log("Chart data set to:", chartData)
        } else {
          console.error("Query failed or no data:", result)
          toast({
            title: "Warning",
            description: result.error || "Query returned no data",
            variant: "destructive",
          })
        }
      } else {
        console.error("No database selected")
        toast({
          title: "Error",
          description: "No database selected",
          variant: "destructive",
        })
      }

      // Create chart object matching backend schema
      const backendChart = {
        type: newChart.type,
        title: newChart.title,
        query: generatedQuery,
        database_id: selectedChartDatabase ? parseInt(selectedChartDatabase) : 1, // Use selected database ID
        config: {
          xAxis: selectedXColumn,
          yAxis: needsYAxis ? selectedYColumn : undefined,
          data: chartData,
          color: newChart.color || chartColors[0],
        }
      }

      // Also create local chart object for immediate UI update
      const localChart: ChartConfig = {
        id: Date.now().toString(),
        title: newChart.title,
        type: newChart.type as "bar" | "line" | "pie" | "area" | "scatter" | "histogram" | "heatmap" | "donut",
        query: generatedQuery,
        xAxis: selectedXColumn,
        yAxis: needsYAxis ? selectedYColumn : undefined,
        data: chartData,
        color: newChart.color || chartColors[0],
        width: 1, // Default width
        height: 1, // Default height
        position: selectedDashboard.charts.length, // Add to end
        // Grid layout properties
        x: (selectedDashboard.charts.length * 2) % 4, // Auto-position in grid
        y: Math.floor((selectedDashboard.charts.length * 2) / 4) * 2, // Auto-position in grid
        w: 2, // Default width in grid units
        h: 2, // Default height in grid units
        columns: {}, // Initialize empty column mappings
        customColors: {} // Initialize empty custom color mappings
      }

      // Update dashboard with new chart via API
      try {
        const newCharts = [...selectedDashboard.charts.map(chart => ({
          type: chart.type,
          title: chart.title,
          query: chart.query,
          database_id: 1, // Default database ID for existing charts
          config: {
            xAxis: chart.xAxis,
            yAxis: chart.yAxis,
            data: chart.data,
            color: chart.color,
          }
        })), backendChart]
        
        const updatedDashboard = await apiClient.updateDashboard(parseInt(selectedDashboard.id), {
          name: selectedDashboard.name,
          description: selectedDashboard.description,
          charts: newCharts
        })

        // Reload dashboards to get the updated data with proper conversion
        const backendDashboards = await apiClient.getDashboards()
        const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
        setDashboards(frontendDashboards)
        
        // Update selected dashboard
        const updatedSelectedDashboard = frontendDashboards.find(d => d.id === selectedDashboard.id)
        if (updatedSelectedDashboard) {
          setSelectedDashboard(updatedSelectedDashboard)
        }
        
        toast({
          title: "Success",
          description: "Chart created successfully",
        })
      } catch (saveError) {
        console.error('Failed to save chart:', saveError)
        toast({
          title: "Error",
          description: "Failed to save chart to dashboard",
          variant: "destructive",
        })
        
        // Fallback to local state update
        const updatedDashboard = {
          ...selectedDashboard,
          charts: [...selectedDashboard.charts, localChart],
        }

        setDashboards((prev) => prev.map((d) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
        setSelectedDashboard(updatedDashboard)
      }
      
      // Reset form
      setNewChart({ title: "", type: "bar", query: "", color: chartColors[0] })
      setSelectedChartDatabase("")
      setSelectedTable("")
      setSelectedXColumn("")
      setSelectedYColumn("")
      setAvailableTables([])
      setAvailableColumns([])
      setShowCreateChart(false)
      
      toast({
        title: "Success",
        description: "Chart created successfully",
      })
    } catch (error) {
      console.error("Failed to create chart:", error)
      toast({
        title: "Error",
        description: "Failed to create chart",
        variant: "destructive",
      })
    }
  }

  const createDashboard = async () => {
    if (!newDashboard.name) return

    setLoading(true)
    try {
      const createdDashboard = await apiClient.createDashboard({
        name: newDashboard.name,
        description: newDashboard.description,
        charts: []
      })

      // Reload dashboards to get the updated list with proper conversion
      const backendDashboards = await apiClient.getDashboards()
      const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
      setDashboards(frontendDashboards)
      
      // Select the newly created dashboard
      const newDash = frontendDashboards.find(d => d.name === newDashboard.name)
      if (newDash) {
        setSelectedDashboard(newDash)
      }
      
      setNewDashboard({ name: "", description: "" })
      setShowCreateDashboard(false)
      
      toast({
        title: "Success",
        description: "Dashboard created successfully",
      })
    } catch (error) {
      console.error('Error creating dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to create dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteChart = async (chartId: string) => {
    if (!selectedDashboard) return

    try {
      // Filter out the chart to delete
      const remainingLocalCharts = selectedDashboard.charts.filter((c) => c.id !== chartId)
      
      // Convert to backend format
      const newCharts = remainingLocalCharts.map(chart => ({
        type: chart.type,
        title: chart.title,
        query: chart.query,
        database_id: 1, // Default database ID
        config: {
          xAxis: chart.xAxis,
          yAxis: chart.yAxis,
          data: chart.data,
          color: chart.color,
        }
      }))
      
      await apiClient.updateDashboard(parseInt(selectedDashboard.id), {
        name: selectedDashboard.name,
        description: selectedDashboard.description,
        charts: newCharts
      })

      // Reload dashboards to get the updated data with proper conversion
      const backendDashboards = await apiClient.getDashboards()
      const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
      setDashboards(frontendDashboards)
      
      // Update selected dashboard
      const updatedSelectedDashboard = frontendDashboards.find(d => d.id === selectedDashboard.id)
      if (updatedSelectedDashboard) {
        setSelectedDashboard(updatedSelectedDashboard)
      }
      
      toast({
        title: "Success",
        description: "Chart deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete chart:', error)
      toast({
        title: "Error",
        description: "Failed to delete chart",
        variant: "destructive",
      })
      
      // Fallback to local state update
      const updatedDashboard = {
        ...selectedDashboard,
        charts: selectedDashboard.charts.filter((c) => c.id !== chartId),
      }

      setDashboards((prev) => prev.map((d) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
      setSelectedDashboard(updatedDashboard)
    }
  }

  const deleteDashboard = async (dashboardId: string) => {
    try {
      await apiClient.deleteDashboard(dashboardId)
      
      // Reload dashboards
      const backendDashboards = await apiClient.getDashboards()
      const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
      setDashboards(frontendDashboards)
      
      // Clear selected dashboard if it was deleted
      if (selectedDashboard?.id === dashboardId) {
        setSelectedDashboard(frontendDashboards.length > 0 ? frontendDashboards[0] : null)
      }
      
      toast({
        title: "Success",
        description: "Dashboard deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to delete dashboard",
        variant: "destructive",
      })
    }
  }

  const editChart = (chart: ChartConfig) => {
    setEditingChart(chart)
    setNewChart({
      title: chart.title,
      type: chart.type,
      query: chart.query,
      color: chart.color,
    })
    setShowEditChart(true)
  }

  const updateChart = async () => {
    if (!editingChart || !selectedDashboard) return

    try {
      // Update the chart in the dashboard
      const updatedCharts = selectedDashboard.charts.map(chart => 
        chart.id === editingChart.id 
          ? {
              ...chart,
              title: newChart.title || chart.title,
              color: newChart.color || chart.color,
              width: editingChart.width || 1,
              height: editingChart.height || 1,
            }
          : chart
      )

      // Convert to backend format
      const backendCharts = updatedCharts.map(chart => ({
        type: chart.type,
        title: chart.title,
        query: chart.query,
        database_id: 1,
        config: {
          xAxis: chart.xAxis,
          yAxis: chart.yAxis,
          data: chart.data,
          color: chart.color,
          width: chart.width,
          height: chart.height,
          position: chart.position,
        }
      }))

      await apiClient.updateDashboard(parseInt(selectedDashboard.id), {
        name: selectedDashboard.name,
        description: selectedDashboard.description,
        charts: backendCharts
      })

      // Reload dashboards
      const backendDashboards = await apiClient.getDashboards()
      const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
      setDashboards(frontendDashboards)
      
      const updatedSelectedDashboard = frontendDashboards.find(d => d.id === selectedDashboard.id)
      if (updatedSelectedDashboard) {
        setSelectedDashboard(updatedSelectedDashboard)
      }

      setShowEditChart(false)
      setEditingChart(null)
      setNewChart({ title: "", type: "bar", query: "", color: chartColors[0] })

      toast({
        title: "Success",
        description: "Chart updated successfully",
      })
    } catch (error) {
      console.error('Failed to update chart:', error)
      toast({
        title: "Error",
        description: "Failed to update chart",
        variant: "destructive",
      })
    }
  }

  // Function to update dashboard layout and chart positions
  const updateDashboard = async (dashboard: Dashboard) => {
    try {
      // Convert charts to backend format
      const backendCharts = dashboard.charts.map(chart => ({
        type: chart.type,
        title: chart.title,
        query: chart.query,
        database_id: 1,
        config: {
          xAxis: chart.xAxis,
          yAxis: chart.yAxis,
          data: chart.data,
          color: chart.color,
          width: chart.width,
          height: chart.height,
          position: chart.position,
          x: chart.x,
          y: chart.y,
          w: chart.w,
          h: chart.h,
          columns: chart.columns,
          customColors: chart.customColors,
        }
      }))

      await apiClient.updateDashboard(parseInt(dashboard.id), {
        name: dashboard.name,
        description: dashboard.description,
        charts: backendCharts
      })
    } catch (error) {
      console.error('Failed to update dashboard layout:', error)
      toast({
        title: "Warning",
        description: "Failed to save layout changes",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold mb-2">Dashboard Visualization</h2>
          <p className="text-muted-foreground">Create interactive charts and dashboards from your data</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateDashboard} onOpenChange={setShowCreateDashboard}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Grid3X3 className="h-4 w-4" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-name">Dashboard Name</Label>
                  <Input
                    id="dashboard-name"
                    placeholder="My Dashboard"
                    value={newDashboard.name}
                    onChange={(e) => setNewDashboard((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dashboard-description">Description</Label>
                  <Input
                    id="dashboard-description"
                    placeholder="Dashboard description..."
                    value={newDashboard.description}
                    onChange={(e) => setNewDashboard((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDashboard(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createDashboard}>Create Dashboard</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {selectedDashboard && (
            <Dialog open={showCreateChart} onOpenChange={setShowCreateChart}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Chart
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Chart</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chart-title">Chart Title</Label>
                      <Input
                        id="chart-title"
                        placeholder="My Chart"
                        value={newChart.title}
                        onChange={(e) => setNewChart((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select
                        value={newChart.type}
                        onValueChange={(value) => setNewChart((prev) => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(chartTypes).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newChart.type && (
                        <p className="text-xs text-muted-foreground">
                          {getChartTypeDescription(newChart.type as keyof typeof chartTypes)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Database Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="chart-database">Database</Label>
                    <Select value={selectedChartDatabase} onValueChange={setSelectedChartDatabase}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDatabases.map((db) => (
                          <SelectItem key={db.id} value={db.id}>
                            {db.name} ({db.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="chart-table">Table</Label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={setSelectedTable}
                      disabled={!selectedChartDatabase || loadingTables}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select table"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map((table) => (
                          <SelectItem key={table.name} value={table.name}>
                            {table.name} ({(table.rowCount || 0).toLocaleString()} rows)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Column Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="x-axis">
                        {getAxisLabel('x', newChart.type as keyof typeof chartTypes)}
                      </Label>
                      <Select 
                        value={selectedXColumn} 
                        onValueChange={setSelectedXColumn}
                        disabled={!selectedTable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={getAxisPlaceholder('x', newChart.type as keyof typeof chartTypes)} />
                        </SelectTrigger>
                        <SelectContent>
                          {getCompatibleColumns('x').map((column) => (
                            <SelectItem key={column.name} value={column.name}>
                              {column.name} ({column.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!chartTypes[newChart.type as keyof typeof chartTypes]?.noYAxis && (
                      <div className="space-y-2">
                        <Label htmlFor="y-axis">
                          {getAxisLabel('y', newChart.type as keyof typeof chartTypes)}
                        </Label>
                        <Select 
                          value={selectedYColumn} 
                          onValueChange={setSelectedYColumn}
                          disabled={!selectedTable}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={getAxisPlaceholder('y', newChart.type as keyof typeof chartTypes)} />
                          </SelectTrigger>
                          <SelectContent>
                            {getCompatibleColumns('y').map((column) => (
                              <SelectItem key={column.name} value={column.name}>
                                {column.name} ({column.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Generated Query Preview */}
                  {generateQuery() && (
                    <div className="space-y-2">
                      <Label>Generated Query</Label>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm">
                        {generateQuery()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Chart Color</Label>
                    <div className="flex gap-2">
                      {chartColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 ${
                            newChart.color === color ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewChart((prev) => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateChart(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={createChart}
                      disabled={
                        !newChart.title || 
                        !selectedTable || 
                        !selectedXColumn || 
                        (chartTypes[newChart.type as keyof typeof chartTypes]?.noYAxis ? false : !selectedYColumn)
                      }
                    >
                      Create Chart
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit Chart Dialog */}
          {editingChart && (
            <Dialog open={showEditChart} onOpenChange={setShowEditChart}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Edit Chart: {editingChart.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Basic Chart Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-chart-title">Chart Title</Label>
                      <Input
                        id="edit-chart-title"
                        placeholder="Chart Title"
                        value={editingChart.title}
                        onChange={(e) => setEditingChart((prev) => ({ ...prev!, title: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-chart-type">Chart Type</Label>
                      <Select 
                        value={editingChart.type} 
                        onValueChange={(value) => setEditingChart({...editingChart, type: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="donut">Donut Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Chart Colors */}
                  <div className="space-y-2">
                    <Label>Default Chart Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {chartColors.map((color) => (
                        <Button
                          key={color}
                          variant={editingChart.color === color ? "default" : "outline"}
                          size="sm"
                          className="w-8 h-8 p-0 rounded-full"
                          style={{ backgroundColor: color }}
                          onClick={() => setEditingChart((prev) => ({ ...prev!, color }))}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Column Display Names */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Column Display Names</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {editingChart.xAxis && (
                        <div className="space-y-2">
                          <Label>X-Axis Label</Label>
                          <Input
                            placeholder={`Default: ${editingChart.xAxis}`}
                            value={editingChart.columns?.[editingChart.xAxis] || ''}
                            onChange={(e) => setEditingChart(prev => ({
                              ...prev!,
                              columns: {
                                ...prev!.columns,
                                [editingChart.xAxis!]: e.target.value
                              }
                            }))}
                          />
                        </div>
                      )}
                      {editingChart.yAxis && (
                        <div className="space-y-2">
                          <Label>Y-Axis Label</Label>
                          <Input
                            placeholder={`Default: ${editingChart.yAxis}`}
                            value={editingChart.columns?.[editingChart.yAxis] || ''}
                            onChange={(e) => setEditingChart(prev => ({
                              ...prev!,
                              columns: {
                                ...prev!.columns,
                                [editingChart.yAxis!]: e.target.value
                              }
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Custom Colors for Data Series */}
                  {editingChart.data && editingChart.data.length > 0 && (
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Custom Colors for Data Series</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {Array.from(new Set(editingChart.data.map(item => 
                          editingChart.xAxis ? item[editingChart.xAxis] : Object.keys(item)[0]
                        ))).slice(0, 10).map((seriesName, index) => (
                          <div key={seriesName} className="flex items-center gap-2">
                            <Label className="min-w-0 flex-1 truncate">{seriesName}</Label>
                            <div className="flex gap-1">
                              {chartColors.map((color) => (
                                <Button
                                  key={color}
                                  variant={editingChart.customColors?.[seriesName] === color ? "default" : "outline"}
                                  size="sm"
                                  className="w-6 h-6 p-0 rounded-full"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setEditingChart(prev => ({
                                    ...prev!,
                                    customColors: {
                                      ...prev!.customColors,
                                      [seriesName]: color
                                    }
                                  }))}
                                />
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-6 h-6 p-0"
                                onClick={() => {
                                  const newColors = { ...editingChart.customColors }
                                  delete newColors[seriesName]
                                  setEditingChart(prev => ({
                                    ...prev!,
                                    customColors: newColors
                                  }))
                                }}
                                title="Reset to default"
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chart Query (Advanced) */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-chart-query">SQL Query (Advanced)</Label>
                    <Textarea
                      id="edit-chart-query"
                      placeholder="SELECT column1, column2 FROM table_name"
                      value={editingChart.query}
                      onChange={(e) => setEditingChart((prev) => ({ ...prev!, query: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowEditChart(false)
                      setEditingChart(null)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={updateChart}>
                      Update Chart
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dashboard Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-serif font-bold">Dashboards</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 p-4">
                  {dashboards.map((dashboard) => (
                    <div key={dashboard.id} className="flex items-center gap-2">
                      <Button
                        variant={selectedDashboard?.id === dashboard.id ? "secondary" : "ghost"}
                        className="flex-1 justify-start gap-2 h-auto p-3"
                        onClick={() => setSelectedDashboard(dashboard)}
                      >
                        <Grid3X3 className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{dashboard.name}</div>
                          <div className="text-xs text-muted-foreground">{dashboard.charts.length} charts</div>
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteDashboard(dashboard.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-3">
          {selectedDashboard ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold">{selectedDashboard.name}</h3>
                  <p className="text-muted-foreground">{selectedDashboard.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-transparent"
                    onClick={() => setShowCreateChart(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Chart
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-transparent"
                    onClick={() => deleteDashboard(selectedDashboard.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Dashboard
                  </Button>
                </div>
              </div>

              {selectedDashboard.charts.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="font-serif font-bold mb-2">No Charts</CardTitle>
                    <CardDescription className="mb-4">Add your first chart to get started</CardDescription>
                    <Button onClick={() => setShowCreateChart(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Chart
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveGridLayout
                  className="layout"
                  layouts={{}}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                  rowHeight={200}
                  onLayoutChange={(layout, layouts) => {
                    // Update chart positions when layout changes
                    if (!selectedDashboard || !selectedDashboard.charts) return
                    
                    const updatedCharts = selectedDashboard.charts.map(chart => {
                      const layoutItem = layout.find(item => item.i === chart.id)
                      if (layoutItem) {
                        return {
                          ...chart,
                          x: layoutItem.x,
                          y: layoutItem.y,
                          w: layoutItem.w,
                          h: layoutItem.h
                        }
                      }
                      return chart
                    })
                    
                    // Update the dashboard with new chart positions
                    const updatedDashboard = {
                      ...selectedDashboard,
                      charts: updatedCharts
                    }
                    
                    // Update in local state and backend
                    setDashboards(prev => prev.map(d => 
                      d.id === selectedDashboard.id ? updatedDashboard : d
                    ))
                    setSelectedDashboard(updatedDashboard)
                    
                    // Save to backend (debounced to avoid too many calls)
                    updateDashboard(updatedDashboard)
                  }}
                  isDraggable={true}
                  isResizable={true}
                  margin={[16, 16]}
                  containerPadding={[0, 0]}
                >
                  {selectedDashboard.charts.map((chart) => (
                    <div
                      key={chart.id}
                      data-grid={{
                        x: chart.x || 0,
                        y: chart.y || 0,
                        w: chart.w || 2,
                        h: chart.h || 2,
                        minW: 1,
                        minH: 1,
                        maxW: 4,
                        maxH: 4
                      }}
                    >
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getChartIcon(chart.type)}
                              <CardTitle className="font-serif font-bold text-base">{chart.title}</CardTitle>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {chart.type.toUpperCase()}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => editChart(chart)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500"
                                title="Edit Chart"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteChart(chart.id)}
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                title="Delete Chart"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-4rem)] overflow-hidden">
                          {renderChart(chart)}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </ResponsiveGridLayout>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="font-serif font-bold mb-2">Select a Dashboard</CardTitle>
                <CardDescription>Choose a dashboard from the sidebar or create a new one</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
