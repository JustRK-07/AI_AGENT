/**
 * Campaigns Service
 * Handles all campaign-related API operations
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { authService } from './authService';

// Types matching backend schema (enhanced with relations)
export interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string | null;
  type: string;
  isActive: boolean;
  inboundCampaign?: { id: string; name: string } | null;
  outboundCampaign?: { id: string; name: string } | null;
}

export interface Agent {
  id: string;
  name: string;
  livekitAgentName: string | null;
  isActive: boolean;
}

export interface CampaignAgent {
  id: string;
  campaignId: string;
  agentId: string;
  isPrimary: boolean;
  agent: Agent;
}

export interface LiveKitTrunk {
  id: string;
  name: string;
  livekitTrunkId: string | null;
  trunkType: 'INBOUND' | 'OUTBOUND';
  status: 'ACTIVE' | 'INACTIVE' | 'PROVISIONING' | 'ERROR' | 'MAINTENANCE';
  maxConcurrentCalls: number;
  livekitRegion?: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  maxConcurrent: number;
  retryFailed: boolean;
  retryAttempts: number;
  callDelay: number;
  scheduledAt: string | null;
  status: string;
  agentName: string | null;
  sipTrunkId: string | null;
  callerIdNumber: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
    campaignAgents: number;
  };
  phoneNumbers?: PhoneNumber[];
  campaignAgents?: CampaignAgent[];
  livekitTrunk?: LiveKitTrunk | null;
  // Derived fields
  campaignType?: 'INBOUND' | 'OUTBOUND';
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  campaignType?: 'INBOUND' | 'OUTBOUND';  // Campaign type
  agentName?: string;                       // Agent name (required for INBOUND)
  phoneNumbers?: string[];                  // Phone numbers (required for INBOUND)
  maxConcurrent?: number;
  retryFailed?: boolean;
  retryAttempts?: number;
  callDelay?: number;
  scheduledAt?: string;
  status?: string;
  sipTrunkId?: string;
  callerIdNumber?: string;
}

export interface UpdateCampaignData {
  name?: string;
  description?: string;
  maxConcurrent?: number;
  retryFailed?: boolean;
  retryAttempts?: number;
  callDelay?: number;
  status?: string;
  agentName?: string;
  sipTrunkId?: string;
  callerIdNumber?: string;
}

export interface CampaignStats {
  totalLeads: number;
  completedLeads: number;
  failedLeads: number;
  pendingLeads: number;
  successRate: number;
}

/**
 * Helper function to transform campaign data
 * Uses campaignType from campaign if available, otherwise derives from livekitTrunk.trunkType
 */
function transformCampaign(campaign: Campaign): Campaign {
  return {
    ...campaign,
    campaignType: campaign.campaignType || campaign.livekitTrunk?.trunkType || undefined,
  };
}

/**
 * Campaigns Service
 */
export const campaignsService = {
  /**
   * Get tenant ID for API calls
   * System admins need to specify a tenant ID
   */
  getTenantId(): string {
    const tenantId = authService.getTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID found. System administrators must select a tenant.');
    }
    return tenantId;
  },

  /**
   * Get all campaigns for the current tenant
   */
  async getAll(params?: { status?: string; page?: number; limit?: number }): Promise<{
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: Campaign[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(API_ENDPOINTS.CAMPAIGNS(tenantId), { params });

      // Transform campaigns to include derived campaignType
      const campaigns = response.data.map(transformCampaign);

      return {
        campaigns,
        total: response.pagination.total,
        page: response.pagination.page,
        limit: response.pagination.limit,
      };
    } catch (error: any) {
      console.error('Get campaigns error:', error);
      throw new Error(error.error || 'Failed to fetch campaigns');
    }
  },

  /**
   * Get campaign by ID
   */
  async getById(campaignId: string): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: Campaign;
      }>(API_ENDPOINTS.CAMPAIGN_BY_ID(tenantId, campaignId));

      // Transform campaign to include derived campaignType
      return transformCampaign(response.data);
    } catch (error: any) {
      console.error('Get campaign error:', error);
      throw new Error(error.error || 'Failed to fetch campaign');
    }
  },

  /**
   * Create new campaign
   */
  async create(data: CreateCampaignData): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGNS(tenantId),
        data
      );

      return response.data;
    } catch (error: any) {
      console.error('Create campaign error:', error);
      throw new Error(error.error || 'Failed to create campaign');
    }
  },

  /**
   * Update campaign
   */
  async update(campaignId: string, data: UpdateCampaignData): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.patch<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGN_BY_ID(tenantId, campaignId),
        data
      );

      return response.data;
    } catch (error: any) {
      console.error('Update campaign error:', error);
      throw new Error(error.error || 'Failed to update campaign');
    }
  },

  /**
   * Delete campaign
   */
  async delete(campaignId: string): Promise<void> {
    try {
      const tenantId = this.getTenantId();
      await apiClient.delete(
        API_ENDPOINTS.CAMPAIGN_BY_ID(tenantId, campaignId)
      );
    } catch (error: any) {
      console.error('Delete campaign error:', error);
      throw new Error(error.error || 'Failed to delete campaign');
    }
  },

  /**
   * Start campaign
   */
  async start(campaignId: string): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGN_START(tenantId, campaignId)
      );

      return response.data;
    } catch (error: any) {
      console.error('Start campaign error:', error);
      throw new Error(error.error || 'Failed to start campaign');
    }
  },

  /**
   * Pause campaign
   */
  async pause(campaignId: string): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGN_PAUSE(tenantId, campaignId)
      );

      return response.data;
    } catch (error: any) {
      console.error('Pause campaign error:', error);
      throw new Error(error.error || 'Failed to pause campaign');
    }
  },

  /**
   * Resume campaign
   */
  async resume(campaignId: string): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGN_RESUME(tenantId, campaignId)
      );

      return response.data;
    } catch (error: any) {
      console.error('Resume campaign error:', error);
      throw new Error(error.error || 'Failed to resume campaign');
    }
  },

  /**
   * Stop campaign
   */
  async stop(campaignId: string): Promise<Campaign> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Campaign;
      }>(
        API_ENDPOINTS.CAMPAIGN_STOP(tenantId, campaignId)
      );

      return response.data;
    } catch (error: any) {
      console.error('Stop campaign error:', error);
      throw new Error(error.error || 'Failed to stop campaign');
    }
  },

  /**
   * Restart campaign (resets leads and starts)
   */
  async restart(campaignId: string): Promise<{message: string; campaignId: string; totalLeads: number}> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        data: {
          campaignId: string;
          totalLeads: number;
          maxConcurrent: number;
        };
      }>(
        `${API_ENDPOINTS.CAMPAIGNS(tenantId)}/${campaignId}/restart`
      );

      return response.data;
    } catch (error: any) {
      console.error('Restart campaign error:', error);
      throw new Error(error.error || 'Failed to restart campaign');
    }
  },

  /**
   * Get campaign statistics
   */
  async getStats(campaignId: string): Promise<CampaignStats> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: CampaignStats;
      }>(
        API_ENDPOINTS.CAMPAIGN_STATS(tenantId, campaignId)
      );

      return response.data;
    } catch (error: any) {
      console.error('Get campaign stats error:', error);
      throw new Error(error.error || 'Failed to fetch campaign statistics');
    }
  },

  /**
   * Initiate test call
   */
  async initiateTestCall(campaignId: string, phoneNumber: string): Promise<{
    message: string;
    phoneNumber: string;
    roomName: string;
    sipCallId: string;
    participantId: string;
    agentName: string;
    timestamp: string;
  }> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: {
          message: string;
          phoneNumber: string;
          roomName: string;
          sipCallId: string;
          participantId: string;
          agentName: string;
          timestamp: string;
        };
      }>(
        API_ENDPOINTS.CAMPAIGN_TEST_CALL(tenantId, campaignId),
        { phoneNumber }
      );

      return response.data;
    } catch (error: any) {
      console.error('Initiate test call error:', error);
      throw new Error(error.error || error.details || 'Failed to initiate test call');
    }
  },
};

export default campaignsService;
