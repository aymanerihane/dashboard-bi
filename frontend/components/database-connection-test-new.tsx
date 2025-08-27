"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TestTube } from 'lucide-react'
import { ConnectionForm } from './connection-form'
import type { DatabaseConfig } from '@/lib/database'

export function DatabaseConnectionTest() {
  const [showForm, setShowForm] = useState(true)

  const handleFormCancel = () => {
    // Reset form or close
    setShowForm(false)
    setTimeout(() => setShowForm(true), 100) // Quick reset
  }

  const handleFormSave = (config: DatabaseConfig) => {
    // In test mode, we don't actually save, just show success
    console.log('Test connection successful for:', config.name)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif font-bold flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Database Connection Testing
          </CardTitle>
          <CardDescription>
            Test connections to various databases without saving the configuration. 
            Perfect for validating credentials and connection parameters.
          </CardDescription>
        </CardHeader>
      </Card>

      {showForm && (
        <ConnectionForm
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          testOnly={true}
        />
      )}
    </div>
  )
}
