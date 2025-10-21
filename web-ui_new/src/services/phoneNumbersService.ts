/**
 * Phone Numbers Service
 * Handles all phone number-related API operations
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { authService } from './authService';

// Types matching backend schema
export interface PhoneNumber {
  id: string;
  number: string;
  friendlyName: string | null;
  type: string;
  isActive: boolean;
  campaignId: string | null;
  tenantId: string;
  platformTrunkId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailablePhoneNumber {
  phoneNumber: string;
  locality: string;
  region: string;
  postalCode: string;
  isoCountry: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
}

export interface CreatePhoneNumberData {
  phoneNumber: string;
  friendlyName?: string;
  campaignId?: string;
  type?: string;
}

export interface UpdatePhoneNumberData {
  friendlyName?: string;
  campaignId?: string;
  isActive?: boolean;
}

export interface PhoneNumberSearchParams {
  areaCode?: string;
  contains?: string;
  region?: string;
  country?: string;
  limit?: number;
}

/**
 * Phone Numbers Service
 */
export const phoneNumbersService = {
  /**
   * Get tenant ID for API calls
   */
  getTenantId(): string {
    const tenantId = authService.getTenantId();
    if (!tenantId) {
      throw new Error('No tenant ID found. System administrators must select a tenant.');
    }
    return tenantId;
  },

  /**
   * Get all phone numbers for the current tenant
   */
  async getAll(params?: { status?: string; page?: number; limit?: number }): Promise<{
    data: PhoneNumber[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: PhoneNumber[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(API_ENDPOINTS.PHONE_NUMBERS(tenantId), { params });

      return {
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error('Get phone numbers error:', error);
      throw new Error(error.error || 'Failed to fetch phone numbers');
    }
  },

  /**
   * Get phone number by ID
   */
  async getById(phoneNumberId: string): Promise<PhoneNumber> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: PhoneNumber;
      }>(API_ENDPOINTS.PHONE_NUMBER_BY_ID(tenantId, phoneNumberId));

      return response.data;
    } catch (error: any) {
      console.error('Get phone number error:', error);
      throw new Error(error.error || 'Failed to fetch phone number');
    }
  },

  /**
   * Search available phone numbers from Twilio
   */
  async searchAvailable(params: PhoneNumberSearchParams): Promise<AvailablePhoneNumber[]> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: AvailablePhoneNumber[];
      }>(API_ENDPOINTS.PHONE_NUMBER_AVAILABLE(tenantId), { params });

      return response.data || [];
    } catch (error: any) {
      console.error('Search available phone numbers error:', error);
      throw new Error(error.error || 'Failed to search available phone numbers');
    }
  },

  /**
   * Purchase/create new phone number
   */
  async purchase(data: CreatePhoneNumberData): Promise<PhoneNumber> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: PhoneNumber;
      }>(API_ENDPOINTS.PHONE_NUMBERS(tenantId), data);

      return response.data;
    } catch (error: any) {
      console.error('Purchase phone number error:', error);
      throw new Error(error.error || 'Failed to purchase phone number');
    }
  },

  /**
   * Update phone number
   */
  async update(phoneNumberId: string, data: UpdatePhoneNumberData): Promise<PhoneNumber> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.patch<{
        success: boolean;
        data: PhoneNumber;
      }>(API_ENDPOINTS.PHONE_NUMBER_BY_ID(tenantId, phoneNumberId), data);

      return response.data;
    } catch (error: any) {
      console.error('Update phone number error:', error);
      throw new Error(error.error || 'Failed to update phone number');
    }
  },

  /**
   * Delete phone number
   */
  async delete(phoneNumberId: string, releaseFromProvider: boolean = false): Promise<void> {
    try {
      const tenantId = this.getTenantId();
      await apiClient.delete(API_ENDPOINTS.PHONE_NUMBER_BY_ID(tenantId, phoneNumberId), {
        params: { release: releaseFromProvider },
      });
    } catch (error: any) {
      console.error('Delete phone number error:', error);
      throw new Error(error.error || 'Failed to delete phone number');
    }
  },
};

export default phoneNumbersService;
