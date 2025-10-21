/**
 * Trunks Service
 * Handles all trunk-related API operations (LiveKit and Platform trunks)
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';

// LiveKit Trunk Types
export interface LiveKitTrunk {
  id: string;
  name: string;
  description: string | null;
  livekitTrunkId: string | null;
  livekitRegion: string | null;
  trunkType: 'INBOUND' | 'OUTBOUND';
  status: 'ACTIVE' | 'INACTIVE' | 'PROVISIONING' | 'ERROR' | 'MAINTENANCE';
  tenantId: string;
  platformTrunkId: string;
  maxConcurrentCalls: number;
  codecPreferences: string[] | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  tenant?: {
    id: string;
    name: string;
    domain: string;
  };
  platformTrunk?: {
    id: string;
    name: string;
  };
}

export interface CreateLiveKitTrunkData {
  name: string;
  description?: string;
  livekitRegion?: string;
  trunkType?: 'INBOUND' | 'OUTBOUND';
  tenantId: string;
  maxConcurrentCalls?: number;
  codecPreferences?: string[];
}

export interface UpdateLiveKitTrunkData {
  name?: string;
  description?: string;
  livekitRegion?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PROVISIONING' | 'ERROR' | 'MAINTENANCE';
  maxConcurrentCalls?: number;
  codecPreferences?: string[];
  isActive?: boolean;
}

// Platform Trunk Types
export interface PlatformTrunk {
  id: string;
  name: string;
  description: string | null;
  twilioAccountSid: string | null;
  twilioTrunkSid: string | null;
  twilioRegion: string | null;
  maxChannels: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Derived fields
  _count?: {
    livekitTrunks: number;
  };
}

export interface CreatePlatformTrunkData {
  name?: string;
  description?: string;
  twilioRegion?: string;
  maxChannels?: number;
}

export interface UpdatePlatformTrunkData {
  name?: string;
  description?: string;
  twilioAuthToken?: string;
  twilioRegion?: string;
  maxChannels?: number;
  isActive?: boolean;
}

/**
 * LiveKit Trunks Service
 */
export const liveKitTrunksService = {
  /**
   * Get all LiveKit trunks
   */
  async getAll(params?: {
    tenantId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: LiveKitTrunk[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        success?: boolean;
        data: LiveKitTrunk[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(API_ENDPOINTS.LIVEKIT_TRUNKS, { params });

      return {
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error('Get LiveKit trunks error:', error);
      throw new Error(error.error || 'Failed to fetch LiveKit trunks');
    }
  },

  /**
   * Get LiveKit trunk by ID
   */
  async getById(trunkId: string): Promise<LiveKitTrunk> {
    try {
      const response = await apiClient.get<LiveKitTrunk>(
        API_ENDPOINTS.LIVEKIT_TRUNK_BY_ID(trunkId)
      );

      return response;
    } catch (error: any) {
      console.error('Get LiveKit trunk error:', error);
      throw new Error(error.error || 'Failed to fetch LiveKit trunk');
    }
  },

  /**
   * Create new LiveKit trunk
   */
  async create(data: CreateLiveKitTrunkData): Promise<LiveKitTrunk> {
    try {
      const response = await apiClient.post<LiveKitTrunk>(
        API_ENDPOINTS.LIVEKIT_TRUNKS,
        data
      );

      return response;
    } catch (error: any) {
      console.error('Create LiveKit trunk error:', error);
      throw new Error(error.error || error.details || 'Failed to create LiveKit trunk');
    }
  },

  /**
   * Update LiveKit trunk
   */
  async update(trunkId: string, data: UpdateLiveKitTrunkData): Promise<LiveKitTrunk> {
    try {
      const response = await apiClient.put<LiveKitTrunk>(
        API_ENDPOINTS.LIVEKIT_TRUNK_BY_ID(trunkId),
        data
      );

      return response;
    } catch (error: any) {
      console.error('Update LiveKit trunk error:', error);
      throw new Error(error.error || 'Failed to update LiveKit trunk');
    }
  },

  /**
   * Delete LiveKit trunk
   */
  async delete(trunkId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.LIVEKIT_TRUNK_BY_ID(trunkId));
    } catch (error: any) {
      console.error('Delete LiveKit trunk error:', error);
      throw new Error(error.error || 'Failed to delete LiveKit trunk');
    }
  },
};

/**
 * Platform Trunks Service
 */
export const platformTrunksService = {
  /**
   * Get all platform trunks
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    data: PlatformTrunk[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const response = await apiClient.get<{
        success?: boolean;
        data: PlatformTrunk[];
        pagination?: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(API_ENDPOINTS.PLATFORM_TRUNKS, { params });

      return {
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error('Get platform trunks error:', error);
      throw new Error(error.error || 'Failed to fetch platform trunks');
    }
  },

  /**
   * Get platform trunk by ID
   */
  async getById(trunkId: string): Promise<PlatformTrunk> {
    try {
      const response = await apiClient.get<PlatformTrunk>(
        API_ENDPOINTS.PLATFORM_TRUNK_BY_ID(trunkId)
      );

      return response;
    } catch (error: any) {
      console.error('Get platform trunk error:', error);
      throw new Error(error.error || 'Failed to fetch platform trunk');
    }
  },

  /**
   * Create new platform trunk
   */
  async create(data: CreatePlatformTrunkData): Promise<PlatformTrunk> {
    try {
      const response = await apiClient.post<PlatformTrunk>(
        API_ENDPOINTS.PLATFORM_TRUNKS,
        data
      );

      return response;
    } catch (error: any) {
      console.error('Create platform trunk error:', error);
      throw new Error(error.error || error.details || 'Failed to create platform trunk');
    }
  },

  /**
   * Update platform trunk
   */
  async update(trunkId: string, data: UpdatePlatformTrunkData): Promise<PlatformTrunk> {
    try {
      const response = await apiClient.put<PlatformTrunk>(
        API_ENDPOINTS.PLATFORM_TRUNK_BY_ID(trunkId),
        data
      );

      return response;
    } catch (error: any) {
      console.error('Update platform trunk error:', error);
      throw new Error(error.error || 'Failed to update platform trunk');
    }
  },

  /**
   * Delete platform trunk
   */
  async delete(trunkId: string): Promise<void> {
    try {
      await apiClient.delete(API_ENDPOINTS.PLATFORM_TRUNK_BY_ID(trunkId));
    } catch (error: any) {
      console.error('Delete platform trunk error:', error);
      throw new Error(error.error || 'Failed to delete platform trunk');
    }
  },
};

/**
 * Combined Trunks Service
 * Provides a unified interface for both LiveKit and Platform trunks
 */
export const trunksService = {
  livekit: liveKitTrunksService,
  platform: platformTrunksService,
};

export default trunksService;
