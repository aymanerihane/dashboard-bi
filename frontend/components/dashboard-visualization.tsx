"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { BarChart3, LineChartIcon, PieChartIcon, TrendingUp, Plus, Settings, Save, Trash2, Grid3X3 } from "lucide-react"
import type { DatabaseConfig } from "@/lib/database"

interface DashboardVisualizationProps {
  database: DatabaseConfig
}

interface ChartConfig {
  id: string
  title: string
  type: "bar" | "line" | "pie" | "area"
  query: string
  xAxis?: string
  yAxis?: string
  data: any[]
  color: string
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
  const [dashboards, setDashboards] = useState<Dashboard[]>([
    {
      id: "1",
      name: "Business Overview",
      description: "Key metrics and performance indicators",
      createdAt: new Date(Date.now() - 86400000),
      charts: [
        {
          id: "1",
          title: "User Growth",
          type: "line",
          query: "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as users FROM users GROUP BY month",
          xAxis: "month",
          yAxis: "users",
          data: mockChartData.userGrowth,
          color: "#10b981",
        },
        {
          id: "2",
          title: "Order Status Distribution",
          type: "pie",
          query: "SELECT status, COUNT(*) as value FROM orders GROUP BY status",
          data: mockChartData.orderStatus,
          color: "#3b82f6",
        },
      ],
    },
  ])

  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(dashboards[0])
  const [showCreateChart, setShowCreateChart] = useState(false)
  const [showCreateDashboard, setShowCreateDashboard] = useState(false)
  const [newChart, setNewChart] = useState<Partial<ChartConfig>>({
    title: "",
    type: "bar",
    query: "",
    color: chartColors[0],
  })
  const [newDashboard, setNewDashboard] = useState({ name: "", description: "" })

  const renderChart = (chart: ChartConfig) => {
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
              <XAxis dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]} fill={chart.color} />
            </BarChart>
          </ResponsiveContainer>
        )

      case "line":
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chart.xAxis || Object.keys(chart.data[0] || {})[0]} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={chart.yAxis || Object.keys(chart.data[0] || {})[1]}
                stroke={chart.color}
                strokeWidth={2}
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
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-muted-foreground">Unsupported chart type</div>
    }
  }

  const createChart = () => {
    if (!newChart.title || !newChart.query || !selectedDashboard) return

    const chart: ChartConfig = {
      id: Date.now().toString(),
      title: newChart.title,
      type: newChart.type as "bar" | "line" | "pie" | "area",
      query: newChart.query,
      xAxis: newChart.xAxis,
      yAxis: newChart.yAxis,
      data: mockChartData.productCategories, // Mock data for demo
      color: newChart.color || chartColors[0],
    }

    const updatedDashboard = {
      ...selectedDashboard,
      charts: [...selectedDashboard.charts, chart],
    }

    setDashboards((prev) => prev.map((d) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
    setSelectedDashboard(updatedDashboard)
    setNewChart({ title: "", type: "bar", query: "", color: chartColors[0] })
    setShowCreateChart(false)
  }

  const createDashboard = () => {
    if (!newDashboard.name) return

    const dashboard: Dashboard = {
      id: Date.now().toString(),
      name: newDashboard.name,
      description: newDashboard.description,
      charts: [],
      createdAt: new Date(),
    }

    setDashboards((prev) => [...prev, dashboard])
    setSelectedDashboard(dashboard)
    setNewDashboard({ name: "", description: "" })
    setShowCreateDashboard(false)
  }

  const deleteChart = (chartId: string) => {
    if (!selectedDashboard) return

    const updatedDashboard = {
      ...selectedDashboard,
      charts: selectedDashboard.charts.filter((c) => c.id !== chartId),
    }

    setDashboards((prev) => prev.map((d) => (d.id === selectedDashboard.id ? updatedDashboard : d)))
    setSelectedDashboard(updatedDashboard)
  }

  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChart3 className="h-4 w-4" />
      case "line":
        return <LineChartIcon className="h-4 w-4" />
      case "pie":
        return <PieChartIcon className="h-4 w-4" />
      case "area":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
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
                          <SelectItem value="bar">Bar Chart</SelectItem>
                          <SelectItem value="line">Line Chart</SelectItem>
                          <SelectItem value="area">Area Chart</SelectItem>
                          <SelectItem value="pie">Pie Chart</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chart-query">SQL Query</Label>
                    <textarea
                      id="chart-query"
                      className="w-full h-24 p-3 border rounded-md font-mono text-sm"
                      placeholder="SELECT column1, column2 FROM table_name..."
                      value={newChart.query}
                      onChange={(e) => setNewChart((prev) => ({ ...prev, query: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="x-axis">X-Axis Column</Label>
                      <Input
                        id="x-axis"
                        placeholder="column_name"
                        value={newChart.xAxis}
                        onChange={(e) => setNewChart((prev) => ({ ...prev, xAxis: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="y-axis">Y-Axis Column</Label>
                      <Input
                        id="y-axis"
                        placeholder="column_name"
                        value={newChart.yAxis}
                        onChange={(e) => setNewChart((prev) => ({ ...prev, yAxis: e.target.value }))}
                      />
                    </div>
                  </div>
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
                    <Button onClick={createChart}>Create Chart</Button>
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
                    <Button
                      key={dashboard.id}
                      variant={selectedDashboard?.id === dashboard.id ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2 h-auto p-3"
                      onClick={() => setSelectedDashboard(dashboard)}
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{dashboard.name}</div>
                        <div className="text-xs text-muted-foreground">{dashboard.charts.length} charts</div>
                      </div>
                    </Button>
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
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Settings className="h-4 w-4" />
                    Settings
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedDashboard.charts.map((chart) => (
                    <Card key={chart.id}>
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
                              onClick={() => deleteChart(chart.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>{renderChart(chart)}</CardContent>
                    </Card>
                  ))}
                </div>
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
