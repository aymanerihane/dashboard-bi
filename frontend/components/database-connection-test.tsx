"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'
import { Loader2, Database, TestTube, Plus, Trash2, Edit, RefreshCw } from 'lucide-react'

interface DatabaseConnection {
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
}

interface ConnectionForm {
  name: string
  db_type: string
  host: string
  port: number
  database_name: string
  username: string
  password: string
}

export function DatabaseConnectionTest() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<number | null>(null)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [form, setForm] = useState<ConnectionForm>({
    name: '',
    db_type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: ''
  })

  // Load connections on component mount
  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getDatabases()
      setConnections(data)
      setSuccess('Connections loaded successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError('')
      
      if (editingId) {
        // Update existing connection
        const updated = await apiClient.updateDatabase(editingId, form)
        setConnections(prev => prev.map(conn => 
          conn.id === editingId ? updated : conn
        ))
        setSuccess('Connection updated successfully')
        setEditingId(null)
      } else {
        // Create new connection
        const newConnection = await apiClient.createDatabase(form)
        setConnections(prev => [...prev, newConnection])
        setSuccess('Connection created successfully')
      }
      
      // Reset form
      setForm({
        name: '',
        db_type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database_name: '',
        username: '',
        password: ''
      })
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (connectionId: number) => {
    try {
      setTesting(connectionId)
      setError('')
      
      const result = await apiClient.testConnection(connectionId)
      
      if (result.success) {
        setSuccess(`Connection test successful! Latency: ${result.latency}ms`)
        // Update the connection status locally
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId ? { ...conn, status: 'connected' } : conn
        ))
      } else {
        setError(`Connection test failed: ${result.message}${result.error ? ` - ${result.error}` : ''}`)
        // Update the connection status locally
        setConnections(prev => prev.map(conn => 
          conn.id === connectionId ? { ...conn, status: 'error' } : conn
        ))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test connection failed')
    } finally {
      setTesting(null)
    }
  }

  const deleteConnection = async (connectionId: number) => {
    if (!confirm('Are you sure you want to delete this connection?')) return
    
    try {
      setLoading(true)
      setError('')
      
      await apiClient.deleteDatabase(connectionId)
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
      setSuccess('Connection deleted successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (connection: DatabaseConnection) => {
    setForm({
      name: connection.name,
      db_type: connection.db_type,
      host: connection.host,
      port: connection.port,
      database_name: connection.database_name,
      username: connection.username,
      password: ''
    })
    setEditingId(connection.id)
    setShowForm(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
      case 'disconnected':
      default:
        return <Badge className="bg-gray-100 text-gray-800">Disconnected</Badge>
    }
  }

  const getDefaultPort = (dbType: string) => {
    switch (dbType) {
      case 'postgresql': return 5432
      case 'mysql': return 3306
      case 'mongodb': return 27017
      case 'sqlite': return 0
      default: return 5432
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Database Connection Test</h2>
        <div className="space-x-2">
          <Button onClick={loadConnections} variant="outline" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            Add Connection
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Connection Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Connection' : 'Create New Connection'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update the connection details' : 'Enter the database connection details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Connection Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="My Database"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="db_type">Database Type</Label>
                  <Select 
                    value={form.db_type} 
                    onValueChange={(value) => {
                      setForm({ 
                        ...form, 
                        db_type: value, 
                        port: getDefaultPort(value) 
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="mongodb">MongoDB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.db_type !== 'sqlite' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={form.host}
                      onChange={(e) => setForm({ ...form, host: e.target.value })}
                      placeholder="localhost"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 0 })}
                      placeholder={form.db_type === 'mongodb' ? '27017' : '5432'}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="database_name">
                    {form.db_type === 'sqlite' ? 'Database File Path' : 
                     form.db_type === 'mongodb' ? 'Database Name' : 'Database Name'}
                  </Label>
                  <Input
                    id="database_name"
                    value={form.database_name}
                    onChange={(e) => setForm({ ...form, database_name: e.target.value })}
                    placeholder={
                      form.db_type === 'sqlite' ? '/path/to/database.db' :
                      form.db_type === 'mongodb' ? 'mymongodbname' : 'mydatabase'
                    }
                    required
                  />
                </div>
                
                {form.db_type !== 'sqlite' && (
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="username"
                      required
                    />
                  </div>
                )}
              </div>

              {form.db_type !== 'sqlite' && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="password"
                    required={!editingId}
                  />
                  {editingId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Leave blank to keep current password
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? 'Update Connection' : 'Create Connection'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setForm({
                      name: '',
                      db_type: 'postgresql',
                      host: 'localhost',
                      port: 5432,
                      database_name: '',
                      username: '',
                      password: ''
                    })
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      <div className="grid gap-4">
        {loading && connections.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No database connections found</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                Create Your First Connection
              </Button>
            </CardContent>
          </Card>
        ) : (
          connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>{connection.name}</span>
                      {getStatusBadge(connection.status)}
                    </CardTitle>
                    <CardDescription>
                      {connection.db_type.toUpperCase()} • {
                        connection.db_type === 'sqlite' 
                          ? connection.database_name 
                          : `${connection.host}:${connection.port}/${connection.database_name}`
                      }
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testConnection(connection.id)}
                      disabled={testing === connection.id}
                    >
                      {testing === connection.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(connection)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteConnection(connection.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Type:</strong> {connection.db_type}
                  </div>
                  <div>
                    <strong>Username:</strong> {connection.username || 'N/A'}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(connection.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Updated:</strong> {new Date(connection.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
