import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Database, 
  Plus, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Play,
  Pause,
  Monitor
} from "lucide-react";

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'sqlite' | 'redis' | 'supabase' | 'planetscale' | 'neon';
  config: any;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  schema?: any;
}

interface SyncRule {
  id: string;
  sourceDb: string;
  targetDb: string;
  tables: string[];
  syncType: 'bidirectional' | 'source_to_target' | 'target_to_source';
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  conflictResolution: 'latest_wins' | 'source_wins' | 'target_wins' | 'manual';
  enabled: boolean;
}

export default function DatabaseEcosystem() {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [syncRules, setSyncRules] = useState<SyncRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const { toast } = useToast();

  // New connection form
  const [newConnection, setNewConnection] = useState({
    name: '',
    type: 'postgresql' as const,
    config: {
      host: '',
      port: '',
      database: '',
      user: '',
      password: '',
      connectionString: '',
      ssl: true
    }
  });

  // New sync rule form
  const [newSyncRule, setNewSyncRule] = useState({
    sourceDb: '',
    targetDb: '',
    tables: [''],
    syncType: 'source_to_target' as const,
    frequency: 'daily' as const,
    conflictResolution: 'latest_wins' as const,
    enabled: true
  });

  useEffect(() => {
    loadConnections();
    loadSyncRules();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/database/connections');
      const result = await response.json();
      
      if (result.success) {
        setConnections(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load database connections",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load database connections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncRules = async () => {
    try {
      const response = await fetch('/api/database/sync-rules');
      const result = await response.json();
      
      if (result.success) {
        setSyncRules(result.data);
      }
    } catch (error) {
      console.error('Failed to load sync rules:', error);
    }
  };

  const createConnection = async () => {
    if (!newConnection.name.trim()) {
      toast({
        title: "Error",
        description: "Connection name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/database/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnection),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Database connection "${result.data.name}" created successfully`,
        });
        setNewConnection({
          name: '',
          type: 'postgresql',
          config: {
            host: '',
            port: '',
            database: '',
            user: '',
            password: '',
            connectionString: '',
            ssl: true
          }
        });
        loadConnections();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create database connection",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create database connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSyncRule = async () => {
    if (!newSyncRule.sourceDb || !newSyncRule.targetDb) {
      toast({
        title: "Error",
        description: "Source and target databases are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/database/sync-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSyncRule,
          tables: newSyncRule.tables.filter(t => t.trim())
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Sync rule created successfully",
        });
        setNewSyncRule({
          sourceDb: '',
          targetDb: '',
          tables: [''],
          syncType: 'source_to_target',
          frequency: 'daily',
          conflictResolution: 'latest_wins',
          enabled: true
        });
        loadSyncRules();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create sync rule",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sync rule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const performSync = async (ruleId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/database/sync/${ruleId}`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Database synchronization completed successfully",
        });
        loadConnections(); // Refresh to update last sync times
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to perform sync",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'connected': 'default',
      'disconnected': 'secondary',
      'error': 'destructive'
    };
    return (
      <Badge variant={variants[status] as any}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const updateConfigForType = (type: string) => {
    const configs = {
      postgresql: { port: '5432', ssl: true },
      mysql: { port: '3306', ssl: false },
      mongodb: { port: '27017', ssl: false },
      sqlite: { path: './database.sqlite' },
      neon: { ssl: true },
      supabase: { ssl: true },
      planetscale: { ssl: true }
    };

    setNewConnection(prev => ({
      ...prev,
      type: type as any,
      config: { ...prev.config, ...(configs as any)[type] }
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Ecosystem</h1>
          <p className="text-muted-foreground">
            Universal database connectivity and intelligent synchronization
          </p>
        </div>
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Database className="h-3 w-3 mr-1" />
          Multi-Database Platform
        </Badge>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="sync-rules">Sync Rules</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="query-console">Query Console</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Database Connection</CardTitle>
              <CardDescription>
                Connect to PostgreSQL, MySQL, MongoDB, SQLite, and cloud databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conn-name">Connection Name</Label>
                  <Input
                    id="conn-name"
                    placeholder="My Production Database"
                    value={newConnection.name}
                    onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conn-type">Database Type</Label>
                  <Select
                    value={newConnection.type}
                    onValueChange={updateConfigForType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="mongodb">MongoDB</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="neon">Neon (Serverless PostgreSQL)</SelectItem>
                      <SelectItem value="supabase">Supabase</SelectItem>
                      <SelectItem value="planetscale">PlanetScale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newConnection.type !== 'sqlite' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="conn-host">Host</Label>
                      <Input
                        id="conn-host"
                        placeholder="localhost"
                        value={newConnection.config.host}
                        onChange={(e) => setNewConnection({ 
                          ...newConnection, 
                          config: { ...newConnection.config, host: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conn-port">Port</Label>
                      <Input
                        id="conn-port"
                        placeholder="5432"
                        value={newConnection.config.port}
                        onChange={(e) => setNewConnection({ 
                          ...newConnection, 
                          config: { ...newConnection.config, port: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conn-database">Database</Label>
                      <Input
                        id="conn-database"
                        placeholder="myapp"
                        value={newConnection.config.database}
                        onChange={(e) => setNewConnection({ 
                          ...newConnection, 
                          config: { ...newConnection.config, database: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conn-user">Username</Label>
                      <Input
                        id="conn-user"
                        placeholder="postgres"
                        value={newConnection.config.user}
                        onChange={(e) => setNewConnection({ 
                          ...newConnection, 
                          config: { ...newConnection.config, user: e.target.value }
                        })}
                      />
                    </div>
                  </>
                )}

                {newConnection.type === 'sqlite' && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="conn-path">Database Path</Label>
                    <Input
                      id="conn-path"
                      placeholder="./database.sqlite"
                      value={newConnection.config.path}
                      onChange={(e) => setNewConnection({ 
                        ...newConnection, 
                        config: { ...newConnection.config, path: e.target.value }
                      })}
                    />
                  </div>
                )}

                {(newConnection.type === 'neon' || newConnection.type === 'supabase' || newConnection.type === 'planetscale') && (
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="conn-url">Connection String</Label>
                    <Input
                      id="conn-url"
                      placeholder="postgresql://username:password@host:port/database"
                      value={newConnection.config.connectionString}
                      onChange={(e) => setNewConnection({ 
                        ...newConnection, 
                        config: { ...newConnection.config, connectionString: e.target.value }
                      })}
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <Button onClick={createConnection} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Connection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Connections</CardTitle>
              <CardDescription>
                Manage your database connections and view their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading connections...</div>
              ) : (
                <div className="grid gap-4">
                  {connections.map((connection) => (
                    <div
                      key={connection.id}
                      className="p-4 border rounded-lg cursor-pointer transition-colors hover:border-gray-300"
                      onClick={() => setSelectedConnection(connection)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(connection.status)}
                            <h3 className="font-semibold">{connection.name}</h3>
                            <Badge variant="outline">{connection.type}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {getStatusBadge(connection.status)}
                            {connection.lastSync && (
                              <span>Last sync: {new Date(connection.lastSync).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Sync Rule</CardTitle>
              <CardDescription>
                Set up automatic synchronization between databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source-db">Source Database</Label>
                  <Select
                    value={newSyncRule.sourceDb}
                    onValueChange={(value) => setNewSyncRule({ ...newSyncRule, sourceDb: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source database" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target-db">Target Database</Label>
                  <Select
                    value={newSyncRule.targetDb}
                    onValueChange={(value) => setNewSyncRule({ ...newSyncRule, targetDb: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target database" />
                    </SelectTrigger>
                    <SelectContent>
                      {connections.map((conn) => (
                        <SelectItem key={conn.id} value={conn.id}>
                          {conn.name} ({conn.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sync-type">Sync Type</Label>
                  <Select
                    value={newSyncRule.syncType}
                    onValueChange={(value) => setNewSyncRule({ ...newSyncRule, syncType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="source_to_target">Source → Target</SelectItem>
                      <SelectItem value="target_to_source">Target → Source</SelectItem>
                      <SelectItem value="bidirectional">Bidirectional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newSyncRule.frequency}
                    onValueChange={(value) => setNewSyncRule({ ...newSyncRule, frequency: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="tables">Tables to Sync</Label>
                  <Input
                    placeholder="table1, table2, table3"
                    value={newSyncRule.tables.join(', ')}
                    onChange={(e) => setNewSyncRule({ 
                      ...newSyncRule, 
                      tables: e.target.value.split(',').map(t => t.trim())
                    })}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    checked={newSyncRule.enabled}
                    onCheckedChange={(checked) => setNewSyncRule({ ...newSyncRule, enabled: checked })}
                  />
                  <Label htmlFor="enabled">Enable automatic sync</Label>
                </div>

                <div className="col-span-2">
                  <Button onClick={createSyncRule} disabled={loading}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Sync Rule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sync Rules</CardTitle>
              <CardDescription>
                Monitor and manage your database synchronization rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {syncRules.map((rule) => {
                  const sourceConn = connections.find(c => c.id === rule.sourceDb);
                  const targetConn = connections.find(c => c.id === rule.targetDb);
                  
                  return (
                    <div key={rule.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {sourceConn?.name} → {targetConn?.name}
                            </h3>
                            <Badge variant={rule.enabled ? "default" : "secondary"}>
                              {rule.enabled ? "Active" : "Paused"}
                            </Badge>
                            <Badge variant="outline">{rule.frequency}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tables: {rule.tables.join(', ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Conflict resolution: {rule.conflictResolution.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => performSync(rule.id)}
                            disabled={loading}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Monitoring</CardTitle>
              <CardDescription>
                Real-time monitoring of database connections and sync operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Connections</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{connections.length}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Active Connections</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {connections.filter(c => c.status === 'connected').length}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Sync Rules</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{syncRules.length}</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Real-time Syncs</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {syncRules.filter(r => r.frequency === 'realtime' && r.enabled).length}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-4">Recent Sync Activity</h3>
                <div className="space-y-2">
                  {connections
                    .filter(c => c.lastSync)
                    .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())
                    .slice(0, 5)
                    .map((connection) => (
                      <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <Database className="h-4 w-4" />
                          <span className="font-medium">{connection.name}</span>
                          <Badge variant="outline">{connection.type}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(connection.lastSync!).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="query-console" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Query Console</CardTitle>
              <CardDescription>
                Execute queries directly against your connected databases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="query-db">Select Database</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose database to query" />
                      </SelectTrigger>
                      <SelectContent>
                        {connections.filter(c => c.status === 'connected').map((conn) => (
                          <SelectItem key={conn.id} value={conn.id}>
                            {conn.name} ({conn.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="query">SQL Query</Label>
                  <textarea
                    id="query"
                    className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                    placeholder="SELECT * FROM users WHERE created_at > NOW() - INTERVAL '1 day'"
                  />
                </div>
                
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Query
                </Button>
                
                <div className="border rounded-md p-4 bg-gray-50">
                  <p className="text-sm text-muted-foreground">Query results will appear here...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}