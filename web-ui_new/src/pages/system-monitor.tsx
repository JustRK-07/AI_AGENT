import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, ExternalLink, Server, Globe, Settings, Database, Activity, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { API_BASE_URL } from '@/config/api.config';

interface SystemMonitorData {
  agents: any[];
  deployedServices: any[];
  systemInfo: any;
  envConfig: any;
  urls: any;
  stats: any;
  computeResources: {
    totalServices: number;
    totalMemoryMB: number;
    totalCPU: number;
    services: any[];
  };
  timestamp: string;
}

interface AgentLogs {
  [serviceName: string]: {
    logs: any[];
    loading: boolean;
    expanded: boolean;
  };
}

export default function SystemMonitor() {
  const [data, setData] = useState<SystemMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [agentLogs, setAgentLogs] = useState<AgentLogs>({});

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/system/info`);
      if (!response.ok) throw new Error('Failed to fetch system info');
      const result = await response.json();
      setData(result.data);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentLogs = async (serviceName: string) => {
    setAgentLogs(prev => ({
      ...prev,
      [serviceName]: { ...prev[serviceName], loading: true }
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/system/agent/${serviceName}/logs?limit=50`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      const result = await response.json();

      setAgentLogs(prev => ({
        ...prev,
        [serviceName]: {
          logs: result.data.logs || [],
          loading: false,
          expanded: prev[serviceName]?.expanded || false
        }
      }));
    } catch (err) {
      console.error(`Error fetching logs for ${serviceName}:`, err);
      setAgentLogs(prev => ({
        ...prev,
        [serviceName]: {
          ...prev[serviceName],
          loading: false
        }
      }));
    }
  };

  const toggleLogs = (serviceName: string) => {
    const isCurrentlyExpanded = agentLogs[serviceName]?.expanded;

    setAgentLogs(prev => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        expanded: !isCurrentlyExpanded
      }
    }));

    // Fetch logs if expanding and not already loaded
    if (!isCurrentlyExpanded && !agentLogs[serviceName]?.logs) {
      fetchAgentLogs(serviceName);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh logs for expanded agents every 15 seconds
  useEffect(() => {
    const expandedServices = Object.keys(agentLogs).filter(
      key => agentLogs[key]?.expanded
    );

    if (expandedServices.length === 0) return;

    const interval = setInterval(() => {
      expandedServices.forEach(serviceName => {
        fetchAgentLogs(serviceName);
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [agentLogs]);

  if (loading && !data) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-8 py-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-8 py-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchData} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Calculate deployment statistics
  const totalAgents = data.agents.length;
  const deployedAgentsCount = data.deployedServices.length;
  const notDeployedCount = totalAgents - deployedAgentsCount;

  // Create a map of deployed service names for quick lookup
  const deployedServiceNames = new Set(
    data.deployedServices.map((s: any) => s.name.toLowerCase())
  );

  // Check if an agent is deployed
  const isAgentDeployed = (agent: any) => {
    const sanitizedName = agent.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const serviceName = `agent-${sanitizedName}-${agent.id.substring(0, 8)}`;
    return deployedServiceNames.has(serviceName);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 py-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.activeAgents} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deployed Agents</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deployedAgentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Running on Cloud Run
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Deployed</CardTitle>
            <Server className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{notDeployedCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting deployment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.tenants}</div>
            <p className="text-xs text-muted-foreground">
              Total organizations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="agents">Deployed Agents</TabsTrigger>
          <TabsTrigger value="urls">URLs</TabsTrigger>
          <TabsTrigger value="compute">GCP Compute</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Deployed Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Deployment Status</CardTitle>
              <CardDescription>
                {deployedAgentsCount} of {totalAgents} agents deployed to Cloud Run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployment</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Voice</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.agents.map((agent) => {
                    const deployed = isAgentDeployed(agent);
                    const sanitizedName = agent.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    const serviceName = `agent-${sanitizedName}-${agent.id.substring(0, 8)}`;
                    const deployedService = data.deployedServices.find(
                      (s: any) => s.name.toLowerCase() === serviceName
                    );

                    return (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>
                          <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                            {agent.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {deployed ? (
                            <Badge variant="default" className="bg-green-600">
                              ✓ Deployed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Not Deployed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{agent.llmModel}</TableCell>
                        <TableCell className="text-sm">{agent.voiceId}</TableCell>
                        <TableCell>
                          {deployed && deployedService && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleLogs(serviceName)}
                              >
                                <Terminal className="h-3 w-3 mr-1" />
                                Logs
                                {agentLogs[serviceName]?.expanded ? (
                                  <ChevronUp className="h-3 w-3 ml-1" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 ml-1" />
                                )}
                              </Button>
                              <a
                                href={deployedService.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Real-time Logs for Deployed Agents */}
          {Object.keys(agentLogs).filter(key => agentLogs[key]?.expanded).map(serviceName => (
            <Card key={serviceName} className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Terminal className="h-5 w-5" />
                    Logs: {serviceName}
                  </span>
                  <div className="flex items-center gap-2">
                    {agentLogs[serviceName]?.loading && (
                      <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchAgentLogs(serviceName)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleLogs(serviceName)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Real-time logs from Cloud Run (auto-refreshes every 15 seconds)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-gray-900 text-gray-100 p-4 font-mono text-xs overflow-auto max-h-96">
                  {agentLogs[serviceName]?.logs && agentLogs[serviceName].logs.length > 0 ? (
                    <div className="space-y-1">
                      {agentLogs[serviceName].logs.map((log: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <span className="text-gray-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`
                            ${log.severity === 'ERROR' ? 'text-red-400' : ''}
                            ${log.severity === 'WARNING' ? 'text-yellow-400' : ''}
                            ${log.severity === 'INFO' ? 'text-blue-400' : ''}
                            whitespace-nowrap
                          `}>
                            [{log.severity}]
                          </span>
                          <span className="text-gray-300 break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : agentLogs[serviceName]?.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                      <span className="ml-2">Loading logs...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      No logs available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* URLs Tab */}
        <TabsContent value="urls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backend API (Cloud Run)</CardTitle>
              <CardDescription>Production backend endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium">Service URL:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.backend.url} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                    {data.urls.backend.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="font-medium">API Endpoint:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.backend.api} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                    {data.urls.backend.api}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>

                <div className="font-medium">Health Check:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.backend.health} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                    {data.urls.backend.health}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frontend UI (Cloud Run)</CardTitle>
              <CardDescription>Production web interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium">Web UI URL:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.frontend.url} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                    {data.urls.frontend.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Deployed Agent Services</CardTitle>
              <CardDescription>Voice agent endpoints on Cloud Run</CardDescription>
            </CardHeader>
            <CardContent>
              {data.urls.agents && data.urls.agents.length > 0 ? (
                <div className="space-y-3">
                  {data.urls.agents.map((agent: any) => (
                    <div key={agent.name} className="border-b pb-3 last:border-0">
                      <div className="font-medium text-sm mb-2">{agent.name}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs pl-4">
                        <div className="text-gray-600">Service URL:</div>
                        <div className="flex items-center gap-1">
                          <a href={agent.url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                            {agent.url}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                        <div className="text-gray-600">Health:</div>
                        <div className="flex items-center gap-1">
                          <a href={agent.health} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline flex items-center gap-1 break-all">
                            {agent.health}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No deployed agents found</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LiveKit & GCP</CardTitle>
              <CardDescription>External services and consoles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium">LiveKit WebSocket:</div>
                <div className="text-gray-700 break-all">{data.urls.livekit.wsUrl}</div>

                <div className="font-medium">LiveKit Dashboard:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.livekit.dashboard} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1">
                    Open Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="font-medium">GCP Project:</div>
                <div className="text-gray-700">{data.urls.gcp.project}</div>

                <div className="font-medium">GCP Region:</div>
                <div className="text-gray-700">{data.urls.gcp.region}</div>

                <div className="font-medium">Cloud Run Console:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.gcp.console} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1">
                    Open Console
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="font-medium">GCP Logs:</div>
                <div className="flex items-center gap-2">
                  <a href={data.urls.gcp.logs} target="_blank" rel="noopener noreferrer"
                     className="text-blue-600 hover:underline flex items-center gap-1">
                    View Logs
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GCP Compute Tab */}
        <TabsContent value="compute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Cloud Compute Resources</CardTitle>
              <CardDescription>Resource allocation for deployed services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">Total Memory</div>
                  <div className="text-2xl font-bold">{(data.computeResources.totalMemoryMB / 1024).toFixed(1)} GB</div>
                  <div className="text-xs text-gray-400">{data.computeResources.totalMemoryMB} MB allocated</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">Total CPU Cores</div>
                  <div className="text-2xl font-bold">{data.computeResources.totalCPU}</div>
                  <div className="text-xs text-gray-400">Across all services</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-gray-500">Active Services</div>
                  <div className="text-2xl font-bold">{data.computeResources.totalServices}</div>
                  <div className="text-xs text-gray-400">Cloud Run services</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>Concurrency</TableHead>
                    <TableHead>Instances</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.computeResources.services.map((service: any) => (
                    <TableRow key={service.name}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {service.memoryMB >= 1024 ? `${(service.memoryMB / 1024).toFixed(1)} GB` : `${service.memoryMB} MB`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.cpu} {service.cpu === 1 ? 'core' : 'cores'}</Badge>
                      </TableCell>
                      <TableCell>{service.concurrency}</TableCell>
                      <TableCell className="text-sm">
                        {service.minInstances} - {service.maxInstances}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Details</CardTitle>
              <CardDescription>Per-service configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.computeResources.services.map((service: any) => (
                  <div key={service.name} className="border-b pb-4 last:border-0">
                    <div className="font-medium mb-2">{service.name}</div>
                    <div className="grid grid-cols-4 gap-4 text-sm pl-4">
                      <div>
                        <div className="text-gray-500">Memory Limit</div>
                        <div className="font-medium">{service.memoryMB >= 1024 ? `${(service.memoryMB / 1024).toFixed(1)} GB` : `${service.memoryMB} MB`}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">CPU Limit</div>
                        <div className="font-medium">{service.cpu} cores</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Max Concurrent</div>
                        <div className="font-medium">{service.concurrency} requests</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Auto-scaling</div>
                        <div className="font-medium">{service.minInstances}-{service.maxInstances} instances</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>System environment settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium">Environment:</div>
                <div>
                  <Badge variant={data.envConfig.nodeEnv === 'production' ? 'default' : 'secondary'}>
                    {data.envConfig.nodeEnv}
                  </Badge>
                </div>

                <div className="font-medium">Port:</div>
                <div className="text-gray-700">{data.envConfig.port}</div>

                <div className="font-medium">API Prefix:</div>
                <div className="text-gray-700">{data.envConfig.apiPrefix}</div>

                <div className="font-medium">CORS Origin:</div>
                <div className="text-gray-700">{data.envConfig.corsOrigin}</div>

                <div className="font-medium">LiveKit URL:</div>
                <div className="text-gray-700">{data.envConfig.livekitUrl}</div>

                <div className="font-medium">LiveKit API Key:</div>
                <div className="text-gray-700">{data.envConfig.livekitApiKey}</div>

                <div className="font-medium">OpenAI Configured:</div>
                <div>
                  <Badge variant={data.envConfig.openaiConfigured ? 'default' : 'destructive'}>
                    {data.envConfig.openaiConfigured ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Info Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Hardware and software details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="font-medium">Hostname:</div>
                <div className="text-gray-700">{data.systemInfo.hostname}</div>

                <div className="font-medium">Platform:</div>
                <div className="text-gray-700">{data.systemInfo.platform}</div>

                <div className="font-medium">Architecture:</div>
                <div className="text-gray-700">{data.systemInfo.arch}</div>

                <div className="font-medium">CPUs:</div>
                <div className="text-gray-700">{data.systemInfo.cpus}</div>

                <div className="font-medium">Total Memory:</div>
                <div className="text-gray-700">{data.systemInfo.totalMemory}</div>

                <div className="font-medium">Free Memory:</div>
                <div className="text-gray-700">{data.systemInfo.freeMemory}</div>

                <div className="font-medium">Uptime:</div>
                <div className="text-gray-700">{data.systemInfo.uptime}</div>

                <div className="font-medium">Node Version:</div>
                <div className="text-gray-700">{data.systemInfo.nodeVersion}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Deployed Services on Cloud Run</CardTitle>
              <CardDescription>Active agent services</CardDescription>
            </CardHeader>
            <CardContent>
              {data.deployedServices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No deployed services found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Traffic</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.deployedServices.map((service) => (
                      <TableRow key={service.name}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <Badge variant={service.ready ? 'default' : 'destructive'}>
                            {service.ready ? 'Ready' : 'Not Ready'}
                          </Badge>
                        </TableCell>
                        <TableCell>{service.traffic}%</TableCell>
                        <TableCell className="text-sm">{service.latestRevision}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(service.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <a href={service.url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:underline flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Open
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
