/**
 * Local Agents Service
 * Handles all local agent heartbeat tracking API operations
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

/**
 * Local Agent Interface
 * Represents a locally running agent tracked via heartbeat
 */
export interface LocalAgent {
  id: string;
  agentId: string;
  name: string;
  description: string | null;
  model: string;
  voice: string;
  temperature: number;
  prompt: string;
  status: 'RUNNING' | 'STOPPED' | 'OFFLINE';
  lastHeartbeat: string;
  processId: string | null;
  port: number | null;
  host: string;
  deploymentMode: string;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Local Agent Query Parameters
 */
export interface LocalAgentQueryParams {
  status?: 'RUNNING' | 'STOPPED' | 'OFFLINE';
  limit?: number;
}

/**
 * Local Agent Response
 */
export interface LocalAgentResponse {
  agents: LocalAgent[];
  count: number;
}

/**
 * Cleanup Response
 */
export interface CleanupResponse {
  cleaned: number;
  remaining: number;
}

/**
 * Local Agents Service
 * Provides methods to interact with local agent heartbeat tracking
 */
export const localAgentsService = {
  /**
   * Get all local agents
   * @param params Optional query parameters (status filter, limit)
   */
  async getAll(params?: LocalAgentQueryParams): Promise<LocalAgentResponse> {
    try {
      // Always filter to only show RUNNING agents
      const queryParams = {
        ...params,
        status: 'RUNNING'
      };

      const response = await apiClient.get<{
        success: boolean;
        agents: LocalAgent[];
        count: number;
      }>(API_ENDPOINTS.LOCAL_AGENTS, { params: queryParams });

      return {
        agents: response.agents || [],
        count: response.count || 0,
      };
    } catch (error: any) {
      console.error('Get local agents error:', error);
      throw new Error(error.error || 'Failed to fetch local agents');
    }
  },

  /**
   * Get specific local agent by ID
   * @param agentId Unique agent identifier
   */
  async getById(agentId: string): Promise<LocalAgent> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        agent: LocalAgent;
      }>(API_ENDPOINTS.LOCAL_AGENT_BY_ID(agentId));

      return response.agent;
    } catch (error: any) {
      console.error('Get local agent error:', error);
      throw new Error(error.error || 'Failed to fetch local agent');
    }
  },

  /**
   * Cleanup stale agents (no heartbeat in X seconds)
   * @param thresholdSeconds Seconds since last heartbeat to consider agent stale (default: 30)
   */
  async cleanupStale(thresholdSeconds: number = 30): Promise<CleanupResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        cleaned: number;
        remaining: number;
        message: string;
      }>(API_ENDPOINTS.LOCAL_AGENTS_CLEANUP, { thresholdSeconds });

      return {
        cleaned: response.cleaned || 0,
        remaining: response.remaining || 0,
      };
    } catch (error: any) {
      console.error('Cleanup stale agents error:', error);
      throw new Error(error.error || 'Failed to cleanup stale agents');
    }
  },

  /**
   * Get agent status badge color
   * Helper function to determine badge color based on status and last heartbeat
   */
  getStatusColor(status: string, lastHeartbeat: string): 'success' | 'warning' | 'error' {
    const heartbeatAge = Date.now() - new Date(lastHeartbeat).getTime();
    const isStale = heartbeatAge > 30000; // 30 seconds

    if (status === 'RUNNING' && !isStale) {
      return 'success';
    } else if (status === 'STOPPED') {
      return 'warning';
    } else {
      return 'error';
    }
  },

  /**
   * Format time ago from timestamp
   * Helper function to display human-readable time
   */
  getTimeAgo(dateString: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  },
};

export default localAgentsService;
