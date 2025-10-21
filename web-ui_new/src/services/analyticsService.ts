/**
 * Analytics Service
 * API client for analytics and performance metrics
 */

import { apiClient } from './apiClient';

export interface AgentPerformance {
  agentId: string | null;
  agentName: string;
  voiceId: string | null;
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  noAnswerCalls: number;
  successRate: number;
  avgDuration: number;
  avgDurationMinutes: number;
  totalDurationMinutes: number;
  callsByStatus: Record<string, number>;
  callsByDate: Record<string, number>;
}

export interface OverallStats {
  totalCalls: number;
  totalAgents: number;
  completedCalls: number;
  failedCalls: number;
  avgSuccessRate: number;
}

export interface AgentPerformanceResponse {
  success: boolean;
  data: {
    agents: AgentPerformance[];
    overall: OverallStats;
  };
}

export interface CallVolumeData {
  date: string;
  total: number;
  completed: number;
  failed: number;
}

export interface CallVolumeResponse {
  success: boolean;
  data: CallVolumeData[];
}

export interface DashboardSummary {
  totalCalls: number;
  completedCalls: number;
  successRate: number;
  avgDurationMinutes: number;
  activeAgents: number;
  activeCampaigns: number;
}

export interface DashboardSummaryResponse {
  success: boolean;
  data: DashboardSummary;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  agentId?: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  agentId: string | null;
  campaignId: string;
  phoneNumber: string;
  callSid: string | null;
  roomName: string | null;
  dispatchId: string | null;
  status: string;
  duration: number | null;
  recordingUrl: string | null;
  error: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  agent?: {
    id: string;
    name: string;
    voiceId: string | null;
  } | null;
  lead?: {
    id: string;
    name: string | null;
    email: string | null;
  };
  campaign?: {
    id: string;
    name: string;
  };
}

export interface CallHistoryResponse {
  success: boolean;
  data: CallLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CallHistoryFilters extends AnalyticsFilters {
  page?: number;
  limit?: number;
  search?: string;
  campaignId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Get agent performance metrics
 */
export async function getAgentPerformance(
  filters?: AnalyticsFilters
): Promise<AgentPerformanceResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.agentId) params.append('agentId', filters.agentId);

  const queryString = params.toString();
  const url = `/analytics/agent-performance${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<AgentPerformanceResponse>(url);
}

/**
 * Get call volume over time
 */
export async function getCallVolumeOverTime(
  filters?: AnalyticsFilters
): Promise<CallVolumeResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  const url = `/analytics/call-volume${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<CallVolumeResponse>(url);
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(
  filters?: AnalyticsFilters
): Promise<DashboardSummaryResponse> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const queryString = params.toString();
  const url = `/analytics/dashboard-summary${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<DashboardSummaryResponse>(url);
}

/**
 * Get call history with search and filters
 */
export async function getCallHistory(
  filters?: CallHistoryFilters
): Promise<CallHistoryResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.search) params.append('search', filters.search);
  if (filters?.agentId) params.append('agentId', filters.agentId);
  if (filters?.campaignId) params.append('campaignId', filters.campaignId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  const queryString = params.toString();
  const url = `/analytics/call-history${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<CallHistoryResponse>(url);
}

/**
 * Get call log details
 */
export async function getCallLogDetails(id: string): Promise<{ success: boolean; data: CallLog }> {
  return apiClient.get<{ success: boolean; data: CallLog }>(`/analytics/call-logs/${id}`);
}

export interface ActiveCall extends CallLog {
  elapsedTime: number;
}

export interface ActiveCallsResponse {
  success: boolean;
  data: ActiveCall[];
  count: number;
}

export interface AgentStatus {
  id: string;
  name: string;
  voiceId: string | null;
  maxConcurrentCalls: number;
  currentCalls: number;
  availableSlots: number;
  availability: number;
  status: 'idle' | 'active' | 'full';
}

export interface AgentStatusResponse {
  success: boolean;
  data: {
    agents: AgentStatus[];
    summary: {
      totalAgents: number;
      activeAgents: number;
      idleAgents: number;
      fullAgents: number;
      totalActiveCalls: number;
    };
  };
}

/**
 * Get currently active calls
 */
export async function getActiveCalls(): Promise<ActiveCallsResponse> {
  return apiClient.get<ActiveCallsResponse>('/analytics/active-calls');
}

/**
 * Get agent status summary
 */
export async function getAgentStatusSummary(): Promise<AgentStatusResponse> {
  return apiClient.get<AgentStatusResponse>('/analytics/agent-status');
}
