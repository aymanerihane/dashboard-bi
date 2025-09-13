"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { BarChart3, LineChartIcon, PieChartIcon, TrendingUp, Plus, Settings, Save, Trash2, Grid3X3, Edit, Move, Maximize, Minimize, Palette, Loader2, ScatterChart, AreaChartIcon, Map, Code } from "lucide-react"
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
  database_id?: number  // Add database_id to track which database the chart uses
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

const chartColors = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16",
  "#f97316", "#ec4899", "#6366f1", "#06b6d4", "#14b8a6", "#a855f7", "#eab308",
  "#f43f5e", "#8b5cf6", "#22c55e", "#0ea5e9", "#f59e0b", "#ef4444", "#6b7280",
  "#64748b", "#78716c", "#52525b", "#374151", "#1f2937", "#111827", "#0f172a",
  "#7c2d12", "#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fcd34d"
]

// Function to generate additional colors dynamically if needed
const generateColor = (index: number): string => {
  if (index < chartColors.length) {
    return chartColors[index]
  }
  // Generate HSL colors with good saturation and lightness for visibility
  const hue = (index * 137.508) % 360 // Golden angle approximation for good distribution
  const saturation = 65 + (index % 4) * 10 // 65-95% saturation
  const lightness = 45 + (index % 3) * 15 // 45-75% lightness
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`
}

export function DashboardVisualization({ database }: DashboardVisualizationProps) {
  // State for dashboards and charts
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)
  const [showCreateChart, setShowCreateChart] = useState(false)
  const [showCreateDashboard, setShowCreateDashboard] = useState(false)
  const [showEditChart, setShowEditChart] = useState(false)
  const [showEditDashboard, setShowEditDashboard] = useState(false)
  const [editingChart, setEditingChart] = useState<ChartConfig | null>(null)
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null)
  const [showFullChart, setShowFullChart] = useState<ChartConfig | null>(null)
  const [dragMode, setDragMode] = useState(false)
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
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
  const [isAdvancedMode, setIsAdvancedMode] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [testingQuery, setTestingQuery] = useState(false)
  const [queryTestResult, setQueryTestResult] = useState<{ success: boolean; message: string; rowCount?: number } | null>(null)
  const { toast } = useToast()

  // Helper function to convert backend chart format to frontend format
  const convertBackendChartToFrontend = (backendChart: any): ChartConfig => {
    // Use backend ID if available, otherwise create a stable ID based on chart properties
    const chartId = backendChart.id 
      ? backendChart.id.toString() 
      : `chart-${backendChart.title}-${backendChart.type}-${backendChart.query}`.replace(/[^a-zA-Z0-9-]/g, '-')
    
    return {
      id: chartId,
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
        console.log('Raw backend dashboards:', backendDashboards)
        
        const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
        console.log('Converted frontend dashboards:', frontendDashboards)
        console.log('Charts grid positions:', frontendDashboards.map(d => ({
          dashboard: d.name,
          charts: d.charts.map(c => ({ id: c.id, title: c.title, x: c.x, y: c.y, w: c.w, h: c.h }))
        })))
        
        const dashboardsWithData = await Promise.all(frontendDashboards.map(async (dashboard) => {
          const chartsWithData = await Promise.all(dashboard.charts.map(async (chart) => {
            const data = await fetchChartData(chart);
            return { ...chart, data };
          }));
          return { ...dashboard, charts: chartsWithData };
        }));

        setDashboards(dashboardsWithData);
        
        // Select first dashboard if available
        if (dashboardsWithData.length > 0) {
          setSelectedDashboard(dashboardsWithData[0]);
        }
      } catch (error) {
        console.error('Failed to load dashboards:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboards()
  }, []) // Remove database dependency to load dashboards immediately

  const fetchChartData = async (chartConfig: ChartConfig): Promise<any[]> => {
    if (!chartConfig.query || !chartConfig.database_id) {
      console.log("Skipping data fetch: no query or database_id for chart", chartConfig.id);
      return chartConfig.data || [];
    }
    console.log(`Fetching data for chart ${chartConfig.id} with query: ${chartConfig.query}`);
    
    setIsLoading(true);
    try {
      const response = await apiClient.executeQuery(
        chartConfig.database_id,
        chartConfig.query
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log(`Data received for chart ${chartConfig.id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching chart data:", error);
      toast({
        title: "Error Fetching Chart Data",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

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
      const table = availableTables.find((t: TableInfo) => t.name === selectedTable)
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

  // Keyboard shortcuts for drag mode and full screen
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showFullChart) {
          setShowFullChart(null)
        } else if (dragMode) {
          setDragMode(false)
          setSelectedChart(null)
        }
      }
      if (event.key === 'd' && event.ctrlKey) {
        event.preventDefault()
        setDragMode(!dragMode)
        setSelectedChart(null)
      }
      if (event.key === 'f' && event.ctrlKey && selectedChart && selectedDashboard) {
        event.preventDefault()
        const chart = selectedDashboard.charts.find((c: ChartConfig) => c.id === selectedChart)
        if (chart) {
          setShowFullChart(chart)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [dragMode, showFullChart, selectedChart])

  const loadDatabases = async () => {
    try {
      const databases = await apiClient.getDatabases()
      // Convert API response to DatabaseConfig format
      const convertedDatabases = databases.map((db: any) => ({
        id: db.id,
        name: db.name,
        type: db.db_type,
        host: db.host,
        port: db.port,
        database: db.database_name,
        username: db.username,
        connection_string: db.connection_string,
        status: db.status
      }))
      setAvailableDatabases(convertedDatabases)
      console.log("Loaded databases:", convertedDatabases.map((db: DatabaseConfig) => ({ 
        id: db.id, 
        name: db.name, 
        type: db.type 
      })))
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
      const tables = await apiClient.getTables(parseInt(selectedChartDatabase))
      setAvailableTables(tables.map(table => ({
        ...table,
        rowCount: table.row_count // Map row_count to rowCount
      })))
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
    // If in advanced mode, use the custom query
    if (isAdvancedMode) {
      return customQuery.trim()
    }
    
    if (!selectedTable || !selectedXColumn) return ""
    
    // Find the selected database to determine its type
    const selectedDb = availableDatabases.find(db => db.id.toString() === selectedChartDatabase)
    const isMongoDb = selectedDb?.type === "mongodb" || selectedDb?.type === "mongodb-atlas"
    console.log("type of db : ", selectedDb?.type)

    // Check if the current chart type needs Y axis
    const chartConfig = chartTypes[newChart.type as keyof typeof chartTypes]
    const needsYAxis = !chartConfig?.noYAxis
    
    // Return empty if Y axis is required but not selected
    if (needsYAxis && !selectedYColumn) return ""
    
    if (isMongoDb) {
      // Generate MongoDB query based on chart type
      if (newChart.type === "pie" || newChart.type === "donut") {
        // MongoDB aggregation for pie/donut charts
        return `db.${selectedTable}.aggregate([
  { $group: { _id: "$${selectedXColumn}", value: { $sum: 1 } } },
  { $project: { name: "$_id", value: 1, _id: 0 } },
  { $sort: { value: -1 } },
  { $limit: 10 }
])`
      } else {
        // MongoDB query for other chart types
        if (needsYAxis) {
          return `db.${selectedTable}.find({}, {${selectedXColumn}: 1, ${selectedYColumn}: 1}).limit(100)`
        } else {
          return `db.${selectedTable}.find({}, {${selectedXColumn}: 1}).limit(100)`
        }
      }
    } else {
      // Generate SQL query based on chart type
      if (newChart.type === "pie" || newChart.type === "donut") {
        // SQL query for pie/donut charts
        return `SELECT ${selectedXColumn} as name, COUNT(*) as value FROM ${selectedTable} GROUP BY ${selectedXColumn} ORDER BY value DESC LIMIT 10`
      } else {
        // SQL query for other chart types
        return needsYAxis 
          ? `SELECT ${selectedXColumn}, ${selectedYColumn} FROM ${selectedTable} LIMIT 100`
          : `SELECT ${selectedXColumn} FROM ${selectedTable} LIMIT 100`
      }
    }
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
    histogram: { label: "Histogram", requiresNumericX: true, noYAxis: true }
    // heatmap: { label: "Heatmap", requiresNumericY: true, requiresCategoricalX: true }
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
        return availableColumns.filter((col: ColumnInfo) => isCategoricalType(col.type))
      }
      if (chartConfig.requiresNumericX) {
        return availableColumns.filter((col: ColumnInfo) => isNumericType(col.type))
      }
      if (chartConfig.allowsDateX) {
        return availableColumns.filter((col: ColumnInfo) => isDateType(col.type) || isNumericType(col.type) || isCategoricalType(col.type))
      }
      return availableColumns
    } else { // y axis
      if (chartConfig.noYAxis) {
        return []
      }
      if (chartConfig.requiresNumericY) {
        return availableColumns.filter((col: ColumnInfo) => isNumericType(col.type))
      }
      return availableColumns
    }
  }

  // Get chart type description
  const getChartTypeDescription = (chartType: string) => {
    const descriptions: Record<string, string> = {
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

  // Get chart icon based on chart type
  const getChartIcon = (chartType: string) => {
    const iconProps = { className: "h-4 w-4" }
    
    switch (chartType) {
      case 'bar':
        return <BarChart3 {...iconProps} />
      case 'line':
        return <LineChartIcon {...iconProps} />
      case 'area':
        return <AreaChartIcon {...iconProps} />
      case 'pie':
      case 'donut':
        return <PieChartIcon {...iconProps} />
      case 'scatter':
        return <ScatterChart {...iconProps} />
      case 'histogram':
        return <BarChart3 {...iconProps} />
      case 'heatmap':
        return <Map {...iconProps} />
      default:
        return <BarChart3 {...iconProps} />
    }
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

  const renderChart = (chart: ChartConfig, isFullScreen = false) => {
    // Check if data exists and is valid
    if (!chart.data || chart.data.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available for this chart</p>
        </div>
      )
    }

    // Determine the correct keys to use for data access
    const isPieDonut = chart.type === 'pie' || chart.type === 'donut';
    const xAxisKey = isPieDonut ? 'name' : chart.xAxis || Object.keys(chart.data[0] || {})[0];
    const yAxisKey = isPieDonut ? 'value' : chart.yAxis || Object.keys(chart.data[0] || {})[1];

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
      height: isFullScreen ? "calc(100vh - 96px)" : 300,
      data: chart.data,
    }

    switch (chart.type) {
      case "bar":
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                label={{ value: getColumnDisplayName(xAxisKey), position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: getColumnDisplayName(yAxisKey), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value) => getColumnDisplayName(xAxisKey) + ': ' + value}
                formatter={(value, name) => [value, getColumnDisplayName(name as string)]}
              />
              <Legend formatter={(value) => getColumnDisplayName(value)} />
              <Bar 
                dataKey={yAxisKey} 
                fill={chart.color}
                name={getColumnDisplayName(yAxisKey)}
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
                dataKey={xAxisKey} 
                label={{ value: getColumnDisplayName(xAxisKey), position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                label={{ value: getColumnDisplayName(yAxisKey), angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(value: any) => getColumnDisplayName(xAxisKey) + ': ' + value}
                formatter={(value: any, name: any) => [value, getColumnDisplayName(name as string)]}
              />
              <Legend formatter={(value: any) => getColumnDisplayName(value)} />
              <Line
                type="monotone"
                dataKey={yAxisKey}
                stroke={chart.color}
                strokeWidth={2}
                name={getColumnDisplayName(yAxisKey)}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey={yAxisKey}
                stroke={chart.color}
                fill={chart.color}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case "pie":
      case "donut":
        // Ensure we only show top 10 values for pie/donut charts
        const topData = chart.data
          .sort((a, b) => (b.value || 0) - (a.value || 0))
          .slice(0, 10)
        
        return (
          <ResponsiveContainer {...commonProps}>
            <PieChart>
              <Pie
                data={topData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                outerRadius={80}
                innerRadius={chart.type === 'donut' ? 40 : 0}
                fill="#8884d8"
                dataKey="value" // Always use "value" for pie/donut charts
                nameKey="name"  // Always use "name" for pie/donut charts
              >
                {topData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getSeriesColor(entry.name, entry.color || generateColor(index))} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any) => [value, name]}
              />
               <Legend formatter={(value: any) => value} />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} type="number" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={yAxisKey}
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
              <XAxis dataKey={xAxisKey} />
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

    // Show loading spinner when creating a chart
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )
    }
  }

  const testCustomQuery = async () => {
    if (!selectedChartDatabase || !customQuery.trim()) {
      toast({
        title: "Error",
        description: "Please select a database and enter a query to test.",
        variant: "destructive",
      })
      return
    }

    setTestingQuery(true)
    setQueryTestResult(null)

    try {
      const result = await apiClient.executeQuery(parseInt(selectedChartDatabase), customQuery.trim())
      
      if (result.success && result.data) {
        setQueryTestResult({
          success: true,
          message: `Query executed successfully! Retrieved ${result.data.length} row(s).`,
          rowCount: result.data.length
        })
        
        toast({
          title: "Query Test Successful",
          description: `Retrieved ${result.data.length} row(s). Query is ready to use.`,
        })
      } else {
        setQueryTestResult({
          success: false,
          message: result.error || "Query failed with unknown error"
        })
        
        toast({
          title: "Query Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Network or server error"
      setQueryTestResult({
        success: false,
        message: errorMessage
      })
      
      toast({
        title: "Query Test Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setTestingQuery(false)
    }
  }

  const createChart = async () => {
    if (!selectedDashboard || !newChart.title || !newChart.type) return

    // Validation based on mode
    if (isAdvancedMode) {
      // In advanced mode, only require database selection and custom query
      if (!selectedChartDatabase || !customQuery.trim()) {
        toast({
          title: "Error",
          description: "Please select a database and enter a custom query.",
          variant: "destructive",
        })
        return
      }
    } else {
      // In simple mode, validate table and column selections
      const chartConfig = chartTypes[newChart.type as keyof typeof chartTypes]
      const needsYAxis = !chartConfig?.noYAxis
      
      if (!selectedTable || !selectedXColumn || (needsYAxis && !selectedYColumn)) {
        toast({
          title: "Error",
          description: "Please complete all required field selections.",
          variant: "destructive",
        })
        return
      }
    }

    // Find the selected database to determine its type
    let selectedDb = availableDatabases.find((db: DatabaseConfig) => db.id.toString() === selectedChartDatabase)
    
    // If database not found in local array, try to fetch it from API
    if (!selectedDb && selectedChartDatabase) {
      console.log("Database not found in local array, fetching from API...")
      try {
        const databases = await apiClient.getDatabases()
        const convertedDatabases = databases.map((db: any) => ({
          id: db.id,
          name: db.name,
          type: db.db_type,
          host: db.host,
          port: db.port,
          database: db.database_name,
          username: db.username,
          connection_string: db.connection_string,
          status: db.status
        }))
        
        selectedDb = convertedDatabases.find(db => db.id.toString() === selectedChartDatabase)
        
        // Update the local array for future use
        setAvailableDatabases((prev: DatabaseConfig[]) => {
          const existingIds = prev.map((db: DatabaseConfig) => db.id)
          const newDatabases = convertedDatabases.filter((db: DatabaseConfig) => !existingIds.includes(db.id))
          return [...prev, ...newDatabases]
        })
        
      } catch (error) {
        console.error("Failed to fetch database info:", error)
      }
    }
    
    if (!selectedDb) {
      console.error("Selected database not found:", {
        selectedChartDatabase,
        availableDatabases: availableDatabases.map(db => ({ id: db.id, name: db.name, type: db.type }))
      })
      toast({
        title: "Error",
        description: "Selected database not found. Please select a valid database.",
        variant: "destructive",
      })
      return
    }
    
    const isMongoDb = selectedDb.type === "mongodb" || selectedDb.type === "mongodb-atlas"
    
    // Generate the query using the centralized generateQuery function
    const generatedQuery = generateQuery()
    
    if (!generatedQuery) {
      console.error("Query generation failed. Check selections.")
      toast({
        title: "Error",
        description: "Could not generate a valid query. Please check your selections.",
        variant: "destructive",
      })
      return
    }
    
    console.log("Database type detection:", { 
      selectedChartDatabase, 
      selectedDbType: selectedDb.type, 
      isMongoDb,
      generatedQuery
    })
    
    try {
      // Execute the query to get real data
      let chartData = []
      if (selectedChartDatabase) {
        console.log(selectedDb.type ? "true : " + selectedDb.type : "false")
        console.log("Executing query:", generatedQuery)
        console.log("Database ID:", selectedChartDatabase)
        
        const result = await apiClient.executeQuery(parseInt(selectedChartDatabase), generatedQuery)
        console.log("Query result:", result)
        
        if (result.success && result.data) {
          // Normalize data before setting it
          chartData = normalizeChartData(result.data, newChart.type as string, selectedDb.type)
          console.log("Normalized chart data set to:", chartData)
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
      const chartId = `chart-${newChart.title}-${newChart.type}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '-')
      const chartConfig = chartTypes[newChart.type as keyof typeof chartTypes]
      const needsYAxis = !chartConfig?.noYAxis
      
      const backendChart = {
        id: chartId,
        type: newChart.type,
        title: newChart.title,
        query: generatedQuery,
        database_id: selectedChartDatabase ? parseInt(selectedChartDatabase) : 1, // Use selected database ID
        config: {
          xAxis: isAdvancedMode ? undefined : selectedXColumn,
          yAxis: isAdvancedMode ? undefined : (needsYAxis ? selectedYColumn : undefined),
          data: chartData,
          color: newChart.color || chartColors[0],
          // Include grid layout properties in config
          x: (selectedDashboard.charts.length * 2) % 4,
          y: Math.floor((selectedDashboard.charts.length * 2) / 4) * 2,
          w: 2,
          h: 2,
        }
      }

      // Also create local chart object for immediate UI update
      const localChart: ChartConfig = {
        id: chartId,
        title: newChart.title,
        type: newChart.type as "bar" | "line" | "pie" | "area" | "scatter" | "histogram" | "heatmap" | "donut",
        query: generatedQuery,
        database_id: selectedChartDatabase ? parseInt(selectedChartDatabase) : undefined, // Add database_id
        xAxis: isAdvancedMode ? undefined : selectedXColumn,
        yAxis: isAdvancedMode ? undefined : (needsYAxis ? selectedYColumn : undefined),
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
      }

      // Update dashboard with new chart via API
      try {
        const newCharts = [...selectedDashboard.charts.map(chart => ({
          id: chart.id,  // Include chart ID
          type: chart.type,
          title: chart.title,
          query: chart.query,
          database_id: 1, // Default database ID for existing charts
          config: {
            xAxis: chart.xAxis,
            yAxis: chart.yAxis,
            data: chart.data,
            color: chart.color,
            x: chart.x,
            y: chart.y,
            w: chart.w,
            h: chart.h,
            columns: chart.columns,
            customColors: chart.customColors,
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

        setDashboards((prev: Dashboard[]) => prev.map((d: Dashboard) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
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
      setIsAdvancedMode(false)
      setCustomQuery("")
      setQueryTestResult(null)
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
      const remainingLocalCharts = selectedDashboard.charts.filter((c: ChartConfig) => c.id !== chartId)
      
      // Convert to backend format
      const newCharts = remainingLocalCharts.map((chart: ChartConfig) => ({
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
        charts: selectedDashboard.charts.filter((c: ChartConfig) => c.id !== chartId),
      }

      setDashboards((prev: Dashboard[]) => prev.map((d: Dashboard) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
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

  const editDashboard = (dashboard: Dashboard) => {
    setEditingDashboard(dashboard)
    setShowEditDashboard(true)
  }

  const updateDashboardInfo = async () => {
    if (!editingDashboard) return

    try {
      await apiClient.updateDashboard(parseInt(editingDashboard.id), {
        name: editingDashboard.name,
        description: editingDashboard.description,
        charts: editingDashboard.charts.map(chart => ({
          id: chart.id,
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
      })

      // Reload dashboards
      const backendDashboards = await apiClient.getDashboards()
      const frontendDashboards = backendDashboards.map(convertBackendDashboardToFrontend)
      setDashboards(frontendDashboards)
      
      // Update selected dashboard
      const updatedSelectedDashboard = frontendDashboards.find(d => d.id === editingDashboard.id)
      if (updatedSelectedDashboard) {
        setSelectedDashboard(updatedSelectedDashboard)
      }

      setShowEditDashboard(false)
      setEditingDashboard(null)

      toast({
        title: "Success",
        description: "Dashboard updated successfully",
      })
    } catch (error) {
      console.error('Failed to update dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to update dashboard",
        variant: "destructive",
      })
    }
  }

  const updateChart = async () => {
    if (!editingChart || !selectedDashboard) return

    try {
      // Update the chart in the dashboard using editingChart values
      const updatedCharts = selectedDashboard.charts.map(chart => 
        chart.id === editingChart.id 
          ? {
              ...chart,
              title: editingChart.title,
              type: editingChart.type,
              query: editingChart.query,
              color: editingChart.color,
              columns: editingChart.columns || {},
              customColors: editingChart.customColors || {},
              // Keep existing grid properties
              x: editingChart.x,
              y: editingChart.y,
              w: editingChart.w,
              h: editingChart.h,
            }
          : chart
      )

      // Convert to backend format
      const backendCharts = updatedCharts.map(chart => ({
        id: chart.id,  // Include chart ID
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

  // Data normalization function
  const normalizeChartData = (data: any[], chartType: string, dbType: string): any[] => {
    if (!data || data.length === 0) return [];

    console.log("Normalizing chart data:", { data, chartType, dbType });

    // For pie/donut charts, ensure the data has the correct format
    if (chartType === 'pie' || chartType === 'donut') {
      let normalizedData = [];
      
      // Check if data already has name/value structure (from MongoDB aggregation)
      if (data.length > 0 && data[0].hasOwnProperty('name') && data[0].hasOwnProperty('value')) {
        console.log("Data already in correct pie/donut format");
        normalizedData = data.map(item => ({
          name: String(item.name || item._id || 'Unknown'),
          value: Number(item.value || 0)
        }));
      } else {
        // If data doesn't have name/value, try to convert it
        // This might happen with SQL results where columns are differently named
        const firstItem = data[0];
        const keys = Object.keys(firstItem);
        
        // Try to find name and value columns
        let nameKey = keys.find(key => 
          key.toLowerCase().includes('name') || 
          key.toLowerCase().includes('label') || 
          key.toLowerCase().includes('category')
        ) || keys[0]; // Use first key as fallback
        
        let valueKey = keys.find(key => 
          key.toLowerCase().includes('value') || 
          key.toLowerCase().includes('count') || 
          key.toLowerCase().includes('total') ||
          key.toLowerCase().includes('amount')
        ) || keys[1] || keys[0]; // Use second key or first as fallback
        
        console.log(`Converting data using nameKey: ${nameKey}, valueKey: ${valueKey}`);
        
        normalizedData = data.map(item => ({
          name: String(item[nameKey] || 'Unknown'),
          value: Number(item[valueKey] || 0)
        }));
      }
      
      // Sort by value descending and take top 10
      normalizedData.sort((a, b) => b.value - a.value);
      return normalizedData.slice(0, 10);
    }

    // For other chart types, return data as-is
    // (they use the raw column names stored in xAxis/yAxis)
    return data;
  }

  // Function to refresh chart data by re-executing the query
  const refreshChartData = async (chart: ChartConfig) => {
    try {
      console.log("Refreshing chart data for:", chart.title)
      console.log("Original query:", chart.query)
      console.log("Database ID:", chart.database_id)

      // Find the database to determine its type
      const chartDatabase = availableDatabases.find(db => db.id === chart.database_id)
      if (!chartDatabase) {
        console.error("Database not found for chart:", chart.database_id)
        return chart
      }

      const isMongoDb = chartDatabase.type === "mongodb" || chartDatabase.type === "mongodb-atlas"
      
      // Convert SQL query to MongoDB if needed
      let queryToExecute = chart.query
      if (isMongoDb && chart.query.toLowerCase().includes('select')) {
        console.log("Converting SQL query to MongoDB for chart:", chart.title)
        
        // Extract table name and columns from SQL query
        const tableMatch = chart.query.match(/FROM\s+(\w+)/i)
        const columnsMatch = chart.query.match(/SELECT\s+(.+?)\s+FROM/i)
        
        if (tableMatch && columnsMatch) {
          const tableName = tableMatch[1]
          const columnsStr = columnsMatch[1].trim()
          
          if (chart.type === "pie" || chart.type === "donut") {
            // Convert GROUP BY query to MongoDB aggregation
            const columnMatch = columnsStr.match(/(\w+)\s+as\s+name/i)
            if (columnMatch) {
              const column = columnMatch[1]
              queryToExecute = `db.${tableName}.aggregate([
                { $group: { _id: "$${column}", value: { $sum: 1 } } },
                { $project: { name: "$_id", value: 1, _id: 0 } },
                { $sort: { value: -1 } },
                { $limit: 10 }
              ])`
            }
          } else {
            // Convert SELECT query to MongoDB find
            const columns = columnsStr.split(',').map(col => col.trim().split(' ')[0])
            const projection = columns.reduce((proj, col) => {
              proj[col] = 1
              return proj
            }, {} as any)
            
            queryToExecute = `db.${tableName}.find({}, ${JSON.stringify(projection)}).limit(100)`
          }
          
          console.log("Converted query:", queryToExecute)
        }
      }

      // Execute the query
      if (!chart.database_id) {
        console.error('Chart missing database_id:', chart.id)
        return chart
      }
      
      const result = await apiClient.executeQuery(chart.database_id, queryToExecute)
      console.log("Query result for chart refresh:", result)

      if (result.success && result.data) {
        // Normalize data
        const normalizedData = normalizeChartData(result.data, chart.type, chartDatabase.type)
        
        // Update chart with new data and query
        const updatedChart = {
          ...chart,
          query: queryToExecute, // Save the converted query
          data: normalizedData
        }
        console.log("Chart data refreshed successfully:", updatedChart.title)
        return updatedChart
      } else {
        console.error("Failed to refresh chart data:", result.error)
        return chart
      }
    } catch (error) {
      console.error("Error refreshing chart data:", error)
      return chart
    }
  }

  // Function to update dashboard layout and chart positions
  const updateDashboard = async (dashboard: Dashboard) => {
    try {
      // Convert charts to backend format
      const backendCharts = dashboard.charts.map(chart => ({
        id: chart.id,  // Include chart ID
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

      console.log('Saving dashboard with charts:', backendCharts.map(c => ({ 
        id: c.id, 
        title: c.title, 
        gridPos: { x: c.config.x, y: c.config.y, w: c.config.w, h: c.config.h }
      })))

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

  // Generate layouts object from chart data for ResponsiveGridLayout
  const generateLayouts = (charts: ChartConfig[]) => {
    const layout = charts.map(chart => ({
      i: chart.id,
      x: chart.x || 0,
      y: chart.y || 0,
      w: chart.w || 2,
      h: chart.h || 2,
      minW: 1,
      minH: 1,
      maxW: 4,
      maxH: 4
    }))

    // Debug: Log the layout being generated
    console.log('Generated layout from charts:', layout)
    console.log('Charts data:', charts.map(c => ({ id: c.id, title: c.title, x: c.x, y: c.y, w: c.w, h: c.h })))

    return {
      lg: layout,
      md: layout.map(item => ({ ...item, w: Math.min(item.w, 3) })),
      sm: layout.map(item => ({ ...item, w: Math.min(item.w, 2) })),
      xs: layout.map(item => ({ ...item, w: 1 })),
      xxs: layout.map(item => ({ ...item, w: 1 }))
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
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Chart</DialogTitle>
                </DialogHeader>
                
                {/* ABSOLUTE FIRST TEST - This should ALWAYS show */}
                <div className="p-4 bg-yellow-300 border-4 border-black text-black text-xl font-bold">
                  🚨 DIALOG IS WORKING! 🚨
                  <br />
                  Available Databases: {availableDatabases.length}
                  <br />
                  Selected Dashboard: {selectedDashboard ? "YES" : "NO"}
                </div>
                
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chart-title">Chart Title</Label>
                      <Input
                        id="chart-title"
                        placeholder="My Chart"
                        value={newChart.title}
                        onChange={(e) => setNewChart((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chart-type">Chart Type</Label>
                      <Select
                        value={newChart.type}
                        onValueChange={(value) => setNewChart((prev) => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger className="w-full">
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
                        <p className="text-xs text-muted-foreground break-words">
                          {getChartTypeDescription(newChart.type as keyof typeof chartTypes)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* TEST: Simple Advanced Mode Toggle */}
                  <div className="space-y-2 p-4 border-2 border-red-500 bg-red-50">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-bold text-red-800">ADVANCED MODE TEST</Label>
                      {/* <Switch
                        checked={isAdvancedMode}
                        onCheckedChange={setIsAdvancedMode}
                      /> */}
                    </div>
                    <p className="text-red-700">
                      Current mode: {isAdvancedMode ? "ADVANCED" : "SIMPLE"}
                    </p>
                  </div>
                  
                  {/* Database Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="chart-database">Database</Label>
                    <Select value={selectedChartDatabase} onValueChange={setSelectedChartDatabase}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select database" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDatabases.map((db) => (
                          <SelectItem key={db.id} value={db.id.toString()}>
                            <span className="truncate">{db.name} ({db.type})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Query Mode Toggle */}
                  <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Query Mode</Label>
                        <p className="text-xs text-muted-foreground">
                          {isAdvancedMode 
                            ? "Write custom SQL or MongoDB queries with joins, aggregations, and complex filtering"
                            : "Simple table and column selection for basic charts"
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor="advanced-mode" className="text-sm">Simple</Label>
                        <input
                          type="checkbox"
                          id="advanced-mode"
                          checked={isAdvancedMode}
                          onChange={(e) => setIsAdvancedMode(e.target.checked)}
                          className="w-5 h-5 rounded border border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Label htmlFor="advanced-mode" className="text-sm">Advanced</Label>
                      </div>
                    </div>

                    {isAdvancedMode && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="custom-query">Custom Query</Label>
                          <div className="space-y-2">
                            <Textarea
                              id="custom-query"
                              placeholder={selectedChartDatabase ? 
                                (availableDatabases.find(db => db.id.toString() === selectedChartDatabase)?.type?.includes('mongodb') ?
                                  `// MongoDB Query Example:\ndb.collection.aggregate([\n  { $group: { _id: "$category", value: { $sum: 1 } } },\n  { $project: { name: "$_id", value: 1, _id: 0 } },\n  { $sort: { value: -1 } },\n  { $limit: 10 }\n])` :
                                  `-- SQL Query Example:\nSELECT \n  category as name,\n  COUNT(*) as value\nFROM products\nGROUP BY category\nORDER BY value DESC\nLIMIT 10`
                                ) : 
                                "Select a database first to see query examples"
                              }
                              value={customQuery}
                              onChange={(e) => setCustomQuery(e.target.value)}
                              className="min-h-[120px] font-mono text-sm"
                              disabled={!selectedChartDatabase}
                            />
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-muted-foreground">
                                {newChart.type === 'pie' || newChart.type === 'donut' 
                                  ? "Query must return 'name' and 'value' columns for pie/donut charts"
                                  : "Query should return appropriate columns for X and Y axis data"
                                }
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={testCustomQuery}
                                disabled={!selectedChartDatabase || !customQuery.trim() || testingQuery}
                                className="gap-2"
                              >
                                {testingQuery ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Code className="h-3 w-3" />
                                )}
                                {testingQuery ? 'Testing...' : 'Test Query'}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Query Test Result */}
                          {queryTestResult && (
                            <div className={`p-3 rounded-md border ${
                              queryTestResult.success 
                                ? 'bg-green-50 border-green-200 text-green-800' 
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-4 h-4 rounded-full mt-0.5 ${
                                  queryTestResult.success ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {queryTestResult.success ? 'Query Test Successful' : 'Query Test Failed'}
                                  </p>
                                  <p className="text-xs mt-1">{queryTestResult.message}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simple Mode: Table and Column Selection */}
                  {!isAdvancedMode && (
                    <>
                      {/* Table Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="chart-table">Table</Label>
                        <Select 
                          value={selectedTable} 
                          onValueChange={setSelectedTable}
                          disabled={!selectedChartDatabase || loadingTables}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={loadingTables ? "Loading tables..." : "Select table"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTables.map((table) => (
                              <SelectItem key={table.name} value={table.name}>
                                <span className="truncate">{table.name} ({(table.rowCount || 0).toLocaleString()} rows)</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Column Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="x-axis">
                            {getAxisLabel('x', newChart.type as keyof typeof chartTypes)}
                          </Label>
                      <Select 
                        value={selectedXColumn} 
                        onValueChange={setSelectedXColumn}
                        disabled={!selectedTable}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={getAxisPlaceholder('x', newChart.type as keyof typeof chartTypes)} />
                        </SelectTrigger>
                        <SelectContent>
                          {getCompatibleColumns('x').map((column) => (
                            <SelectItem key={column.name} value={column.name}>
                              <span className="truncate">{column.name} ({column.type})</span>
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={getAxisPlaceholder('y', newChart.type as keyof typeof chartTypes)} />
                          </SelectTrigger>
                          <SelectContent>
                            {getCompatibleColumns('y').map((column) => (
                              <SelectItem key={column.name} value={column.name}>
                                <span className="truncate">{column.name} ({column.type})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  </>
                  )}

                  {/* Generated Query Preview */}
                  {generateQuery() && (
                    <div className="space-y-2">
                      <Label>Generated Query</Label>
                      <div className="p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto break-all">
                        {generateQuery()}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Chart Color</Label>
                    <div className="flex flex-wrap gap-2">
                      {chartColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                            newChart.color === color ? "border-foreground" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewChart((prev) => ({ ...prev, color }))}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateChart(false)} className="w-full sm:w-auto">
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
                      className="w-full sm:w-auto"
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
              <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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

          {/* Edit Dashboard Dialog */}
          {editingDashboard && (
            <Dialog open={showEditDashboard} onOpenChange={setShowEditDashboard}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Edit Dashboard
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dashboard-name">Dashboard Name</Label>
                    <Input
                      id="edit-dashboard-name"
                      placeholder="Dashboard Name"
                      value={editingDashboard.name}
                      onChange={(e) => setEditingDashboard((prev) => ({ ...prev!, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-dashboard-description">Description</Label>
                    <Textarea
                      id="edit-dashboard-description"
                      placeholder="Describe your dashboard..."
                      value={editingDashboard.description}
                      onChange={(e) => setEditingDashboard((prev) => ({ ...prev!, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowEditDashboard(false)
                      setEditingDashboard(null)
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={updateDashboardInfo}>
                      Update Dashboard
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
                    variant={dragMode ? "default" : "outline"}
                    size="sm" 
                    className="gap-2"
                    title="Toggle drag mode (Ctrl+D)"
                    onClick={() => {
                      setDragMode(!dragMode)
                      setSelectedChart(null)
                    }}
                  >
                    <Move className="h-4 w-4" />
                    {dragMode ? "Exit Drag Mode" : "Drag Mode"}
                  </Button>
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
                    onClick={() => editDashboard(selectedDashboard)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Dashboard
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

              {dragMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                  <Move className="h-4 w-4 text-blue-600" />
                  <div className="text-sm text-blue-800">
                    <strong>Drag Mode Active:</strong> Click a chart to select it, then drag to reposition. 
                    Press <kbd className="px-1 py-0.5 text-xs bg-blue-200 rounded mx-1">Escape</kbd> or <kbd className="px-1 py-0.5 text-xs bg-blue-200 rounded mx-1">Ctrl+D</kbd> to exit.
                    {selectedChart && <span className="ml-2 text-blue-600">• Selected chart can now be dragged</span>}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setDragMode(false)
                      setSelectedChart(null)
                    }}
                    className="ml-auto"
                  >
                    Exit Drag Mode
                  </Button>
                </div>
              )}

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
                  className={`layout ${dragMode ? 'drag-mode' : ''}`}
                  layouts={generateLayouts(selectedDashboard.charts)}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 4, md: 3, sm: 2, xs: 1, xxs: 1 }}
                  rowHeight={200}
                  isDraggable={dragMode}
                  isResizable={dragMode}
                  draggableHandle={selectedChart ? `.draggable-${selectedChart}` : ".no-drag"}
                                   onLayoutChange={(layout, layouts) => {
                    // Only update if drag mode is enabled and chart is selected
                    if (!dragMode || !selectedChart || !selectedDashboard || !selectedDashboard.charts) return
                    
                    console.log('Layout change detected:', layout)
                    console.log('Current charts before update:', selectedDashboard.charts.map(c => ({ id: c.id, x: c.x, y: c.y, w: c.w, h: c.h })))
                    
                    const updatedCharts = selectedDashboard.charts.map(chart => {
                      const layoutItem = layout.find(item => item.i === chart.id)
                      if (layoutItem) {
                        const updatedChart = {
                          ...chart,
                          x: layoutItem.x,
                          y: layoutItem.y,
                          w: layoutItem.w,
                          h: layoutItem.h
                        }
                        console.log(`Updated chart ${chart.id}:`, { 
                          old: { x: chart.x, y: chart.y, w: chart.w, h: chart.h },
                          new: { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
                        })
                        return updatedChart
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
                    console.log('Saving updated dashboard to backend...')
                    updateDashboard(updatedDashboard)
                  }}
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
                      <Card 
                        className={`h-full transition-all duration-200 ${
                          dragMode 
                            ? selectedChart === chart.id 
                              ? 'ring-2 ring-blue-500 shadow-lg cursor-move' 
                              : 'cursor-pointer hover:ring-1 hover:ring-gray-300'
                            : ''
                        }`}
                        onClick={() => {
                          if (dragMode) {
                            setSelectedChart(selectedChart === chart.id ? null : chart.id)
                          }
                        }}
                      >
                        <CardHeader className={`pb-3 ${selectedChart === chart.id ? `draggable-${chart.id}` : ''}`}>
                          {dragMode && (
                            <div className="absolute top-2 left-2 z-10">
                              {selectedChart === chart.id ? (
                                <Badge variant="default" className="text-xs bg-blue-500">
                                  Selected - Drag to move
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Click to select
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getChartIcon(chart.type)}
                              <CardTitle className="font-serif font-bold text-base">{chart.title}</CardTitle>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {chart.type.toUpperCase()}
                              </Badge>
                              {!dragMode && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setShowFullChart(chart)
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-green-500"
                                    title="Full View (Ctrl+F)"
                                  >
                                    <Maximize className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      editChart(chart)
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-500"
                                    title="Edit Chart"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      deleteChart(chart.id)
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    title="Delete Chart"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
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

      {/* Full Chart View Dialog */}
      <Dialog open={showFullChart !== null} onOpenChange={() => setShowFullChart(null)}>
        <DialogContent className="max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] p-0 m-0 overflow-hidden border-0 rounded-none bg-background">
          {/* Floating header with chart title and close button */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              {showFullChart && getChartIcon(showFullChart.type)}
              <span className="max-w-[200px] truncate">{showFullChart?.title}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullChart(null)}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Exit Full Screen (ESC)"
            >
              <Minimize className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Chart container with full viewport usage */}
          <div className="w-full h-full flex items-center justify-center p-6 pt-12">
            <div className="w-full h-full max-h-[calc(100vh-96px)]">
              {showFullChart && renderChart(showFullChart, true)}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DashboardVisualization
