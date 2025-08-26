import { apiClient } from "./api"

export interface DatabaseConfig {
  id: string
  name: string
  type: "postgresql" | "mysql" | "sqlite"
  host?: string
  port?: number
  database: string
  username?: string
  password?: string
  filename?: string // for SQLite
  status?: string
  createdAt?: Date
}

export interface TableInfo {
  name: string
  columns: ColumnInfo[]
  rowCount: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primaryKey: boolean
  defaultValue?: string
}

export interface QueryResult {
  columns: string[]
  rows: any[]
  rowCount: number
  executionTime: number
}

export class DatabaseService {
  private static instance: DatabaseService

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
    }
    return DatabaseService.instance
  }

  async getDatabases(): Promise<DatabaseConfig[]> {
    try {
      const databases = await apiClient.getDatabases()
      const mappedDatabases = databases.map((db) => ({
        id: db.id.toString(),
        name: db.name,
        type: db.db_type as "postgresql" | "mysql" | "sqlite",
        host: db.host,
        port: db.port,
        database: db.database_name,
        username: db.username,
        status: db.status,
        createdAt: new Date(db.created_at),
      }))
      return mappedDatabases
    } catch (error) {
      console.error("DatabaseService: Failed to fetch databases:", error)
      return []
    }
  }

  async createDatabase(config: Omit<DatabaseConfig, "id" | "status" | "createdAt">): Promise<void> {
    await apiClient.createDatabase({
      name: config.name,
      type: config.type,
      host: config.host || "localhost",
      port: config.port || (config.type === "postgresql" ? 5432 : config.type === "mysql" ? 3306 : 0),
      database: config.database,
      username: config.username || "",
      password: config.password || "",
    })
  }

  async updateDatabase(id: string, config: Omit<DatabaseConfig, "id" | "status" | "createdAt">): Promise<void> {
    await apiClient.updateDatabase(id, {
      name: config.name,
      type: config.type,
      host: config.host || "localhost",
      port: config.port || (config.type === "postgresql" ? 5432 : config.type === "mysql" ? 3306 : 0),
      database: config.database,
      username: config.username || "",
      password: config.password || "",
    })
  }

  async deleteDatabase(id: string): Promise<void> {
    await apiClient.deleteDatabase(id)
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string; latency?: number }> {
    return await apiClient.testConnection(id)
  }

  async testConnectionWithPassword(
    database: DatabaseConfig, 
    password: string
  ): Promise<{ success: boolean; message?: string; error?: string; latency?: number }> {
    try {
      return await apiClient.testConnectionStandalone({
        type: database.type,
        host: database.host || "localhost",
        port: database.port || 5432,
        database: database.database,
        username: database.username || "",
        password: password
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection test failed"
      }
    }
  }

  async executeQuery(
    databaseId: string,
    query: string,
  ): Promise<{
    success: boolean
    data: any[]
    columns: Array<{ name: string; type: string }>
    rowCount: number
    executionTime: number
  }> {
    return await apiClient.executeQuery(databaseId, query)
  }

  async getQueryHistory(): Promise<
    Array<{
      id: string
      query: string
      executedAt: string
      executionTime: number
      rowCount: number
    }>
  > {
    const response = await apiClient.getQueryHistory()
    return response.map((item) => ({
      id: item.id.toString(),
      query: item.query,
      executedAt: item.executed_at,
      executionTime: item.execution_time,
      rowCount: item.row_count,
    }))
  }
}

// Mock table data for demo (will be replaced by real API calls later)
export const mockTables: Record<string, TableInfo[]> = {
  "demo-postgres": [
    {
      name: "users",
      rowCount: 1250,
      columns: [
        { name: "id", type: "integer", nullable: false, primaryKey: true },
        { name: "email", type: "varchar(255)", nullable: false, primaryKey: false },
        { name: "name", type: "varchar(100)", nullable: true, primaryKey: false },
        { name: "created_at", type: "timestamp", nullable: false, primaryKey: false },
      ],
    },
    {
      name: "orders",
      rowCount: 3420,
      columns: [
        { name: "id", type: "integer", nullable: false, primaryKey: true },
        { name: "user_id", type: "integer", nullable: false, primaryKey: false },
        { name: "total", type: "decimal(10,2)", nullable: false, primaryKey: false },
        { name: "status", type: "varchar(50)", nullable: false, primaryKey: false },
        { name: "created_at", type: "timestamp", nullable: false, primaryKey: false },
      ],
    },
  ],
}

export const mockDatabases: DatabaseConfig[] = [
  {
    id: "demo-postgres",
    name: "Demo PostgreSQL",
    type: "postgresql",
    host: "localhost",
    port: 5432,
    database: "demo_db",
    username: "demo_user",
    status: "disconnected",
    createdAt: new Date(Date.now() - 86400000 * 7),
  },
  {
    id: "demo-mysql",
    name: "Demo MySQL",
    type: "mysql",
    host: "localhost",
    port: 3306,
    database: "demo_db",
    username: "demo_user",
    status: "disconnected",
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: "demo-sqlite",
    name: "Demo SQLite",
    type: "sqlite",
    database: "demo.db",
    filename: "/path/to/demo.db",
    status: "disconnected",
    createdAt: new Date(Date.now() - 86400000 * 1),
  },
]
