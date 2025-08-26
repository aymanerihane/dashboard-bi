// Utility for persisting application state to localStorage
export class PersistenceManager {
  private static instance: PersistenceManager

  static getInstance(): PersistenceManager {
    if (!PersistenceManager.instance) {
      PersistenceManager.instance = new PersistenceManager()
    }
    return PersistenceManager.instance
  }

  // Dashboard persistence
  saveDashboards(dashboards: any[]) {
    try {
      localStorage.setItem('dashboard-bi-dashboards', JSON.stringify(dashboards))
    } catch (error) {
      console.error('Failed to save dashboards:', error)
    }
  }

  loadDashboards(): any[] {
    try {
      const saved = localStorage.getItem('dashboard-bi-dashboards')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load dashboards:', error)
      return []
    }
  }

  // Query history persistence
  saveQueryHistory(history: any[]) {
    try {
      localStorage.setItem('dashboard-bi-query-history', JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save query history:', error)
    }
  }

  loadQueryHistory(): any[] {
    try {
      const saved = localStorage.getItem('dashboard-bi-query-history')
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Failed to load query history:', error)
      return []
    }
  }

  // Selected database persistence
  saveSelectedDatabase(database: any) {
    try {
      localStorage.setItem('dashboard-bi-selected-database', JSON.stringify(database))
    } catch (error) {
      console.error('Failed to save selected database:', error)
    }
  }

  loadSelectedDatabase(): any | null {
    try {
      const saved = localStorage.getItem('dashboard-bi-selected-database')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Failed to load selected database:', error)
      return null
    }
  }

  clearSelectedDatabase() {
    try {
      localStorage.removeItem('dashboard-bi-selected-database')
    } catch (error) {
      console.error('Failed to clear selected database:', error)
    }
  }

  // Add query to history
  addQueryToHistory(query: {
    id: string
    query: string
    database: string
    executedAt: Date
    executionTime: number
    rowCount: number
    status: 'success' | 'error'
    error?: string
  }) {
    const history = this.loadQueryHistory()
    history.unshift(query) // Add to beginning
    
    // Keep only last 50 queries
    if (history.length > 50) {
      history.splice(50)
    }
    
    this.saveQueryHistory(history)
  }

  // Clear all persisted data
  clearAll() {
    try {
      localStorage.removeItem('dashboard-bi-dashboards')
      localStorage.removeItem('dashboard-bi-query-history')
      localStorage.removeItem('dashboard-bi-selected-database')
    } catch (error) {
      console.error('Failed to clear persisted data:', error)
    }
  }
}
