'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Search, Table as TableIcon, FileText } from 'lucide-react';

interface Connection {
  id: number;
  name: string;
  db_type: string;
  host: string;
  port: number;
  database_name: string;
}

interface TableInfo {
  name: string;
  type: string;
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface ExplorationData {
  type: 'sql' | 'nosql';
  tables?: TableInfo[];
  collections?: TableInfo[] | Array<{name: string, collections: TableInfo[]}>;
  columns?: ColumnInfo[];
  data?: any[];
  row_count?: number;
  total_count?: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
}

export default function ExplorePage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [explorationData, setExplorationData] = useState<ExplorationData | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const exploreConnection = async (connection: Connection) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/queries/explore/${connection.id}/tables`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setExplorationData(data);
        setSelectedConnection(connection);
        setSelectedTable('');
        setTableData(null);
      }
    } catch (error) {
      console.error('Error exploring connection:', error);
    }
    setLoading(false);
  };

  const exploreTable = async (tableName: string) => {
    if (!selectedConnection) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/queries/explore/${selectedConnection.id}/table/${tableName}?page=${currentPage}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
        setSelectedTable(tableName);
      }
    } catch (error) {
      console.error('Error exploring table:', error);
    }
    setLoading(false);
  };

  const searchData = async () => {
    if (!selectedConnection || !selectedTable || !searchTerm) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/queries/explore/${selectedConnection.id}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          table: selectedTable,
          search: searchTerm,
          limit: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTableData(data);
      }
    } catch (error) {
      console.error('Error searching data:', error);
    }
    setLoading(false);
  };

  const renderTablesList = () => {
    if (!explorationData) return null;

    if (explorationData.type === 'sql' && explorationData.tables) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {explorationData.tables.map((table) => (
            <Card key={table.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exploreTable(table.name)}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TableIcon className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{table.name}</span>
                  <Badge variant="secondary">{table.type}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (explorationData.type === 'nosql' && explorationData.collections) {
      if (Array.isArray(explorationData.collections)) {
        // Multiple databases
        return (
          <div className="space-y-6">
            {explorationData.collections.map((database: any) => (
              <div key={database.name}>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {database.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {database.collections.map((collection: any) => (
                    <Card key={collection.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exploreTable(collection.name)}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-green-500" />
                          <span className="font-medium">{collection.name}</span>
                          <Badge variant="secondary">{collection.type}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      } else {
        // Single database
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {explorationData.collections.map((collection: any) => (
              <Card key={collection.name} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exploreTable(collection.name)}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{collection.name}</span>
                    <Badge variant="secondary">{collection.type}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      }
    }

    return null;
  };

  const renderTableData = () => {
    if (!tableData) return null;

    const columns = tableData.columns || tableData.fields || [];
    const data = tableData.data || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {tableData.type === 'sql' ? 'Table' : 'Collection'}: {selectedTable}
          </h3>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button onClick={searchData} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {data.length} rows {tableData.total_count && `of ${tableData.total_count} total`}
        </div>

        {data.length > 0 && (
          <div className="border rounded-lg overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column: any) => (
                    <TableHead key={column.name}>
                      {column.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {column.type}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row: any, index: number) => (
                  <TableRow key={index}>
                    {columns.map((column: any) => (
                      <TableCell key={column.name}>
                        {typeof row[column.name] === 'object' 
                          ? JSON.stringify(row[column.name]) 
                          : String(row[column.name] || '')
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {tableData.has_more && (
          <div className="flex justify-center">
            <Button onClick={() => {
              setCurrentPage(currentPage + 1);
              exploreTable(selectedTable);
            }} disabled={loading}>
              Load More
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Explorer</h1>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="tables" disabled={!selectedConnection}>
            {selectedConnection ? `${selectedConnection.name} - Tables/Collections` : 'Tables/Collections'}
          </TabsTrigger>
          <TabsTrigger value="data" disabled={!selectedTable}>
            {selectedTable ? `Data - ${selectedTable}` : 'Data'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Available Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((connection) => (
                  <Card key={connection.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => exploreConnection(connection)}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{connection.name}</span>
                          <Badge>{connection.db_type}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          {connection.host}:{connection.port}/{connection.database_name}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>
                {explorationData?.type === 'sql' ? 'Tables' : 'Collections'}
                {selectedConnection && ` - ${selectedConnection.name}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                renderTablesList()
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Explorer</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center">Loading...</div>
              ) : (
                renderTableData()
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
