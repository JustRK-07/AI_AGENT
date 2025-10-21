/**
 * Agents Service
 * Handles all agent-related API operations
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// Types matching backend schema
export interface Agent {
  id: string;
  name: string;
  livekitAgentName: string | null;
  description: string | null;
  voiceId: string | null;
  personality: string | null;
  systemPrompt: string | null;
  isActive: boolean;
  maxConcurrentCalls: number;
  llmProvider: string | null;
  llmModel: string | null;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaignAgents: number;
  };
  // Extended fields for detail view
  campaignAgents?: CampaignAgent[];
  // Availability fields (added by load stats)
  activeCalls?: number;
  available?: boolean;
  loadPercentage?: number;
}

export interface CampaignAgent {
  id: string;
  campaignId: string;
  agentId: string;
  isPrimary: boolean;
  campaign?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface CreateAgentData {
  name: string;
  description?: string;
  voiceId?: string;
  personality?: string;
  systemPrompt?: string;
  isActive?: boolean;
  llmProvider?: string;
  llmModel?: string;
  metadata?: any;
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  voiceId?: string;
  personality?: string;
  systemPrompt?: string;
  isActive?: boolean;
  llmProvider?: string;
  llmModel?: string;
  metadata?: any;
}

export interface AgentLoadStats {
  id: string;
  name: string;
  maxConcurrentCalls: number;
  activeCalls: number;
  available: boolean;
  loadPercentage: number;
}

export interface AgentLoadSummary {
  totalAgents: number;
  activeAgents: number;
  availableAgents: number;
  totalActiveCalls: number;
}

/**
 * Agents Service
 */
export const agentsService = {
  /**
   * Get all agents
   */
  async getAll(params?: { isActive?: string; page?: number; limit?: number }): Promise<{
    agents: Agent[];
    total?: number;
    page?: number;
    limit?: number;
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Agent[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(API_ENDPOINTS.AGENTS, { params });

      return {
        agents: response.data || [],
        total: response.pagination?.total,
        page: response.pagination?.page,
        limit: response.pagination?.limit,
      };
    } catch (error: any) {
      console.error('Get agents error:', error);
      throw new Error(error.error || 'Failed to fetch agents');
    }
  },

  /**
   * Get only active/running agents (from local_agents table)
   * These are agents that are currently running and sending heartbeats
   */
  async getActive(): Promise<{
    agents: Agent[];
    count: number;
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        agents: Agent[];
        count: number;
      }>('/local-agents/active');

      return {
        agents: response.agents || [],
        count: response.count || 0,
      };
    } catch (error: any) {
      console.error('Get active agents error:', error);
      throw new Error(error.error || 'Failed to fetch active agents');
    }
  },

  /**
   * Get agent by ID
   */
  async getById(agentId: string): Promise<Agent> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Agent;
      }>(API_ENDPOINTS.AGENT_BY_ID(agentId));

      return response.data;
    } catch (error: any) {
      console.error('Get agent error:', error);
      throw new Error(error.error || 'Failed to fetch agent');
    }
  },

  /**
   * Create new agent
   */
  async create(data: CreateAgentData): Promise<Agent> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: Agent;
      }>(API_ENDPOINTS.AGENTS, data);

      return response.data;
    } catch (error: any) {
      console.error('Create agent error:', error);
      throw new Error(error.error || 'Failed to create agent');
    }
  },

  /**
   * Update agent
   */
  async update(agentId: string, data: UpdateAgentData): Promise<Agent> {
    try {
      const response = await apiClient.put<{
        success: boolean;
        data: Agent;
      }>(API_ENDPOINTS.AGENT_BY_ID(agentId), data);

      return response.data;
    } catch (error: any) {
      console.error('Update agent error:', error);
      throw new Error(error.error || 'Failed to update agent');
    }
  },

  /**
   * Delete agent
   */
  async delete(agentId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.AGENT_BY_ID(agentId));
    } catch (error: any) {
      console.error('Delete agent error:', error);
      throw new Error(error.error || 'Failed to delete agent');
    }
  },

  /**
   * Get agent load statistics
   */
  async getLoadStats(): Promise<{
    data: AgentLoadStats[];
    summary: AgentLoadSummary;
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: AgentLoadStats[];
        summary: AgentLoadSummary;
      }>(API_ENDPOINTS.AGENT_LOAD_STATS);

      return {
        data: response.data || [],
        summary: response.summary || {
          totalAgents: 0,
          activeAgents: 0,
          availableAgents: 0,
          totalActiveCalls: 0,
        },
      };
    } catch (error: any) {
      console.error('Get agent load stats error:', error);
      throw new Error(error.error || 'Failed to fetch agent load statistics');
    }
  },

  // NOTE: Deployment methods removed - core-worker architecture
  // - deployToRailway
  // - getDeploymentFiles
  // - getDeploymentInstructionsUrl
  // - getDeploymentPackageUrl
  // - getDeploymentStatus
  // - deleteDeployment

  /**
   * Validate Python script syntax
   */
  async validateScript(script: string, agentName?: string): Promise<{
    success: boolean;
    valid: boolean;
    error?: string;
    lineNumber?: number;
    columnNumber?: number;
    errorType?: string;
    suggestion?: string;
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        valid: boolean;
        error?: string;
        lineNumber?: number;
        columnNumber?: number;
        errorType?: string;
        suggestion?: string;
      }>(`${API_ENDPOINTS.AGENTS}/validate-script`, {
        script,
        agentName,
      });

      return response;
    } catch (error: any) {
      console.error('Validate script error:', error);
      // Return the validation error details
      return {
        success: false,
        valid: false,
        error: error.error || error.message || 'Failed to validate script',
        errorType: 'ValidationError',
      };
    }
  },
};

export default agentsService;
