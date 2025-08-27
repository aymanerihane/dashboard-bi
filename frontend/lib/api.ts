const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth-token")
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth-token", token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth-token")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.detail || error.message || "Request failed")
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{
      success: boolean
      token: string
      user: {
        id: string
        email: string
        name: string
        role: string
      }
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ success: boolean; message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  }

  async getCurrentUser() {
    return this.request<{
      id: string
      email: string
      name: string
      role: string
    }>("/api/auth/me")
  }

  // Database endpoints
  async getDatabases() {
    return this.request<Array<{
      id: number
      name: string
      db_type: string
      host: string
      port: number
      database_name: string
      username: string
      status: string
      user_id: number
      created_at: string
      updated_at: string
    }>>("/api/databases")
  }

  async createDatabase(config: {
    name: string
    type: string
    host?: string
    port?: number
    database: string
    username?: string
    password?: string
  }) {
    return this.request<{
      id: number
      name: string
      db_type: string
      host: string
      port: number
      database_name: string
      username: string
      status: string
      user_id: number
      created_at: string
      updated_at: string
    }>("/api/databases", {
      method: "POST",
      body: JSON.stringify({
        name: config.name,
        db_type: config.type,
        host: config.host,
        port: config.port,
        database_name: config.database,
        username: config.username,
        password: config.password,
      }),
    })
  }

  async updateDatabase(
    id: string,
    config: {
      name?: string
      type?: string
      host?: string
      port?: number
      database?: string
      username?: string
      password?: string
    },
  ) {
    return this.request<{
      id: number
      name: string
      db_type: string
      host: string
      port: number
      database_name: string
      username: string
      status: string
      user_id: number
      created_at: string
      updated_at: string
    }>(`/api/databases/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: config.name,
        db_type: config.type,
        host: config.host,
        port: config.port,
        database_name: config.database,
        username: config.username,
        password: config.password,
      }),
    })
  }

  async deleteDatabase(id: number) {
    return this.request<{ message: string }>(`/api/databases/${id}`, {
      method: "DELETE",
    })
  }

  async testConnection(id: number) {
    return this.request<{
      success: boolean
      message: string
      latency?: number
    }>(`/api/databases/${id}/test`, {
      method: "POST",
    })
  }

  async connectWithPassword(id: number, password: string) {
    return this.request<{
      success: boolean
      message: string
    }>(`/api/databases/${id}/connect`, {
      method: "POST",
      body: JSON.stringify({ password }),
    })
  }

  async testConnectionStandalone(config: {
    type: string
    host?: string
    port?: number
    database?: string
    username?: string
    password?: string
    connectionString?: string
    file_path?: string
  }) {
    return this.request<{
      success: boolean
      message: string
      latency?: number
      error?: string
    }>("/api/databases/test", {
      method: "POST",
      body: JSON.stringify({
        type: config.type,
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        connectionString: config.connectionString,
        file_path: config.file_path,
      }),
    })
  }

  // Database table endpoints
  async getTables(connectionId: number) {
    return this.request<Array<{
      name: string
      row_count: number
      columns: Array<{
        name: string
        type: string
        nullable: boolean
        primaryKey: boolean
        defaultValue?: string
      }>
    }>>(`/api/databases/${connectionId}/tables`)
  }

  async getTableData(connectionId: number, tableName: string, limit: number = 10, offset: number = 0) {
    return this.request<{
      success: boolean
      data: any[]
      columns: Array<{ name: string; type: string }>
      total: number
    }>(`/api/databases/${connectionId}/tables/${tableName}/data?limit=${limit}&offset=${offset}`)
  }

  // Query endpoints
  async executeQuery(databaseId: number, query: string, limit?: number) {
    return this.request<{
      success: boolean
      data: any[]
      columns: Array<{ name: string; type: string }>
      rowCount: number
      executionTime: number
      error?: string
    }>("/api/queries/execute", {
      method: "POST",
      body: JSON.stringify({ database_id: databaseId, query, limit }),
    })
  }

  async getQueryHistory(limit: number = 10) {
    return this.request<Array<{
      id: number
      query: string
      executed_at: string
      execution_time: number
      row_count: number
      status: string
      error_message?: string
      database_id: number
    }>>(`/api/queries/history?limit=${limit}`)
  }

  // Dashboard endpoints
  async getDashboards() {
    return this.request<Array<{
      id: number
      name: string
      description?: string
      charts: any[]
      user_id: number
      created_at: string
      updated_at: string
    }>>("/api/dashboards")
  }

  async createDashboard(dashboard: {
    name: string
    description?: string
    charts: any[]
  }) {
    return this.request<{ success: boolean; message: string }>("/api/dashboards", {
      method: "POST",
      body: JSON.stringify(dashboard),
    })
  }

  updateDashboard(
    id: number, 
    data: {
      name?: string;
      description?: string;
      charts: any[]
    }
  ) {
    return this.request<{ success: boolean; message: string }>(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteDashboard(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/dashboards/${id}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
