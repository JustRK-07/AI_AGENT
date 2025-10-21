/**
 * Reporting Page
 * Agent performance and conversation analytics
 */

import { useState, useEffect } from "react";
import Head from "next/head";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  MessageSquare,
  Activity,
  TrendingUp,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { withAuth } from "@/components/withAuth";
import {
  getAgentPerformance,
  getDashboardSummary,
  getCallHistory,
  getActiveCalls,
  getAgentStatusSummary,
  type AgentPerformance,
  type DashboardSummary,
  type CallLog,
  type ActiveCall,
  type AgentStatus,
} from "@/services/analyticsService";
import agentsService, { type Agent } from "@/services/agentsService";
import { toast } from "sonner";
import { CallDetailsDialog } from "@/components/CallDetailsDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonCard, SkeletonTable } from "@/components/skeletons";

function Reporting() {
  const [activeTab, setActiveTab] = useState("performance");
  const [isLoading, setIsLoading] = useState(false);

  // Performance tab state
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);

  // Conversation history state
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [callHistoryPagination, setCallHistoryPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);

  // Real-time monitoring state
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [realTimeSummary, setRealTimeSummary] = useState({
    totalAgents: 0,
    activeAgents: 0,
    idleAgents: 0,
    fullAgents: 0,
    totalActiveCalls: 0,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Add minimum loading delay for smooth UX
      const [summaryRes, performanceRes] = await Promise.all([
        getDashboardSummary(),
        getAgentPerformance(),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);

      setSummary(summaryRes.data);
      setAgentPerformance(performanceRes.data.agents);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch call history
  const fetchCallHistory = async (page: number = 1) => {
    try {
      setIsLoading(true);

      const filters: any = {
        page,
        limit: callHistoryPagination.limit,
      };

      if (searchQuery) filters.search = searchQuery;
      if (statusFilter && statusFilter !== 'all') filters.status = statusFilter;
      if (agentFilter && agentFilter !== 'all') filters.agentId = agentFilter;

      // Add minimum loading delay for smooth UX
      const [response] = await Promise.all([
        getCallHistory(filters),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);

      setCallHistory(response.data);
      setCallHistoryPagination(response.pagination);
    } catch (error: any) {
      console.error('Error fetching call history:', error);
      toast.error('Failed to load call history');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agents for filter dropdown
  const fetchAgents = async () => {
    try {
      const response = await agentsService.getAll();
      setAgents(response.agents || []);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
    }
  };

  // Fetch real-time monitoring data
  const fetchRealTimeData = async () => {
    try {
      const [callsRes, statusRes] = await Promise.all([
        getActiveCalls(),
        getAgentStatusSummary(),
      ]);

      setActiveCalls(callsRes.data);
      setAgentStatuses(statusRes.data.agents);
      setRealTimeSummary(statusRes.data.summary);
    } catch (error: any) {
      console.error('Error fetching real-time data:', error);
      // Don't show toast for polling errors to avoid spam
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchAgents();
  }, []);

  // Fetch call history when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'conversations') {
      fetchCallHistory(1);
    }
  }, [activeTab, searchQuery, statusFilter, agentFilter]);

  // Fetch real-time data when tab is active
  useEffect(() => {
    if (activeTab === 'realtime') {
      fetchRealTimeData();
    }
  }, [activeTab]);

  // Auto-refresh real-time data every 5 seconds
  useEffect(() => {
    if (activeTab === 'realtime' && autoRefresh) {
      const interval = setInterval(() => {
        fetchRealTimeData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefresh]);

  // Format duration from milliseconds to readable format
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <>
      <Head>
        <title>Reporting</title>
        <meta name="description" content="Agent Performance and Analytics" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-[1600px] mx-auto px-8 py-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Reporting</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Analytics and Performance Insights
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="performance" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="conversations" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="realtime" className="gap-2">
                <Activity className="h-4 w-4" />
                Real-Time
              </TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="mt-6 space-y-6">
              {/* Summary Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                  {/* Total Calls */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Calls</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {summary.totalCalls}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {summary.completedCalls} completed
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Phone className="h-8 w-8 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Success Rate */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Success Rate</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {summary.successRate}%
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Completion rate
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Avg Call Duration */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {summary.avgDurationMinutes}m
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Per call average
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Clock className="h-8 w-8 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Agents */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Agents</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {summary.activeAgents}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Currently active
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <Users className="h-8 w-8 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Active Campaigns */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {summary.activeCampaigns}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Running now
                          </p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <Activity className="h-8 w-8 text-indigo-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Agent Performance Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Agent Performance</CardTitle>
                      <CardDescription>
                        Detailed performance metrics by agent
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAnalytics}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <SkeletonTable rows={5} columns={7} />
                  ) : agentPerformance.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <AlertCircle className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">No performance data available</p>
                      <p className="text-xs mt-1">
                        Data will appear once agents start making calls
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto animate-fade-in">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent Name</TableHead>
                            <TableHead className="text-right">Total Calls</TableHead>
                            <TableHead className="text-right">Completed</TableHead>
                            <TableHead className="text-right">Failed</TableHead>
                            <TableHead className="text-right">Success Rate</TableHead>
                            <TableHead className="text-right">Avg Duration</TableHead>
                            <TableHead className="text-right">Total Duration</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentPerformance.map((agent) => (
                            <TableRow key={agent.agentId || 'unassigned'}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="text-sm">{agent.agentName}</div>
                                  {agent.voiceId && (
                                    <div className="text-xs text-gray-500">
                                      Voice: {agent.voiceId}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {agent.totalCalls}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center text-green-600">
                                  {agent.completedCalls}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="inline-flex items-center text-red-600">
                                  {agent.failedCalls}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-green-600 h-2 rounded-full"
                                      style={{ width: `${agent.successRate}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {agent.successRate}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {agent.avgDurationMinutes}m
                              </TableCell>
                              <TableCell className="text-right">
                                {agent.totalDurationMinutes}m
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Conversation History</CardTitle>
                      <CardDescription>
                        Browse and search through all agent conversations
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCallHistory(callHistoryPagination.page)}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by phone number or call SID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="answered">Answered</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="no-answer">No Answer</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={agentFilter} onValueChange={setAgentFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Agent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Call History Table */}
                  {isLoading ? (
                    <SkeletonTable rows={5} columns={7} />
                  ) : callHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <MessageSquare className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">No calls found</p>
                      <p className="text-xs mt-1">
                        {searchQuery || statusFilter !== 'all' || agentFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Call history will appear once agents start making calls'}
                      </p>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Phone Number</TableHead>
                              <TableHead>Agent</TableHead>
                              <TableHead>Campaign</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Duration</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {callHistory.map((call) => (
                              <TableRow key={call.id}>
                                <TableCell className="font-medium">
                                  {call.phoneNumber}
                                </TableCell>
                                <TableCell>
                                  {call.agent?.name || 'Unassigned'}
                                </TableCell>
                                <TableCell>
                                  {call.campaign?.name || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      call.status === 'completed' || call.status === 'answered'
                                        ? 'bg-green-100 text-green-700'
                                        : call.status === 'failed' || call.status === 'busy'
                                        ? 'bg-red-100 text-red-700'
                                        : call.status === 'no-answer'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {call.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {call.duration
                                    ? `${Math.floor(call.duration / 1000)}s`
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {new Date(call.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCallId(call.id);
                                      setCallDetailsOpen(true);
                                    }}
                                  >
                                    View Details
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Showing {((callHistoryPagination.page - 1) * callHistoryPagination.limit) + 1} to{' '}
                          {Math.min(callHistoryPagination.page * callHistoryPagination.limit, callHistoryPagination.total)} of{' '}
                          {callHistoryPagination.total} calls
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCallHistory(callHistoryPagination.page - 1)}
                            disabled={callHistoryPagination.page === 1 || isLoading}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchCallHistory(callHistoryPagination.page + 1)}
                            disabled={callHistoryPagination.page === callHistoryPagination.pages || isLoading}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Call Details Dialog */}
            <CallDetailsDialog
              callId={selectedCallId}
              isOpen={callDetailsOpen}
              onClose={() => {
                setCallDetailsOpen(false);
                setSelectedCallId(null);
              }}
            />

            {/* Real-Time Tab */}
            <TabsContent value="realtime" className="mt-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Calls</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {realTimeSummary.totalActiveCalls}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Phone className="h-8 w-8 text-green-600 animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Agents</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {realTimeSummary.activeAgents}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          of {realTimeSummary.totalAgents} total
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Idle Agents</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {realTimeSummary.idleAgents}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Activity className="h-8 w-8 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">At Capacity</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {realTimeSummary.fullAgents}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertCircle className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Calls */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Active Calls</CardTitle>
                      <CardDescription>
                        {activeCalls.length} call{activeCalls.length !== 1 ? 's' : ''} in progress
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="rounded"
                        />
                        Auto-refresh (5s)
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchRealTimeData}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeCalls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <Phone className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">No active calls</p>
                      <p className="text-xs mt-1">
                        Active calls will appear here in real-time
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCalls.map((call) => (
                        <div
                          key={call.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <Phone className="h-5 w-5 text-green-600 animate-pulse" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {call.phoneNumber}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      call.status === 'in-progress'
                                        ? 'bg-green-100 text-green-700'
                                        : call.status === 'ringing'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {call.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                  <span>Agent: {call.agent?.name || 'Unassigned'}</span>
                                  {call.campaign && (
                                    <span>Campaign: {call.campaign.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-mono">
                                    {formatDuration(call.elapsedTime)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Started {new Date(call.createdAt).toLocaleTimeString()}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCallId(call.id);
                                  setCallDetailsOpen(true);
                                }}
                              >
                                Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agent Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Agent Status</CardTitle>
                  <CardDescription>
                    Current availability and load for all agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {agentStatuses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                      <Users className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">No agents available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Agent Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Current Calls</TableHead>
                            <TableHead className="text-right">Max Calls</TableHead>
                            <TableHead className="text-right">Available Slots</TableHead>
                            <TableHead className="text-right">Availability</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {agentStatuses.map((agent) => (
                            <TableRow key={agent.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="text-sm">{agent.name}</div>
                                  {agent.voiceId && (
                                    <div className="text-xs text-gray-500">
                                      Voice: {agent.voiceId}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    agent.status === 'idle'
                                      ? 'bg-gray-100 text-gray-700'
                                      : agent.status === 'active'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {agent.status === 'idle' && 'Idle'}
                                  {agent.status === 'active' && 'Active'}
                                  {agent.status === 'full' && 'At Capacity'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {agent.currentCalls}
                              </TableCell>
                              <TableCell className="text-right">
                                {agent.maxConcurrentCalls}
                              </TableCell>
                              <TableCell className="text-right">
                                {agent.availableSlots}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        agent.availability >= 50
                                          ? 'bg-green-600'
                                          : agent.availability > 0
                                          ? 'bg-yellow-600'
                                          : 'bg-red-600'
                                      }`}
                                      style={{ width: `${agent.availability}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium w-12">
                                    {agent.availability}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default withAuth(Reporting);
