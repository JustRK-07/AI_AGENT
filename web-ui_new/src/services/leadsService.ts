/**
 * Leads Service
 * Handles all lead-related API operations for campaigns
 */

import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { authService } from './authService';

// Types matching backend schema
export interface Lead {
  id: string;
  campaignId: string | null;
  phoneNumber: string;
  name: string | null;
  email: string | null;
  status: string; // pending, calling, answered, completed, no-answer, busy, failed
  priority: number;
  attempts: number;
  metadata: any | null;
  lastCallAt: string | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string | null;
}

export interface CreateLeadData {
  phoneNumber: string;
  name?: string;
  email?: string;
  priority?: number;
  metadata?: any;
}

export interface UpdateLeadData {
  phoneNumber?: string;
  name?: string;
  email?: string;
  status?: string;
  priority?: number;
  metadata?: any;
}

/**
 * Leads Service
 */
export const leadsService = {
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
   * Get all leads for a campaign
   */
  async getAll(campaignId: string, params?: { status?: string; page?: number; limit?: number }): Promise<{
    data: Lead[];
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
        data: Lead[];
        pagination?: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>(API_ENDPOINTS.LEADS(tenantId, campaignId), { params });

      return {
        data: response.data || [],
        pagination: response.pagination,
      };
    } catch (error: any) {
      console.error('Get leads error:', error);
      throw new Error(error.error || 'Failed to fetch leads');
    }
  },

  /**
   * Get lead by ID
   */
  async getById(campaignId: string, leadId: string): Promise<Lead> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.get<{
        success: boolean;
        data: Lead;
      }>(API_ENDPOINTS.LEAD_BY_ID(tenantId, campaignId, leadId));

      return response.data;
    } catch (error: any) {
      console.error('Get lead error:', error);
      throw new Error(error.error || 'Failed to fetch lead');
    }
  },

  /**
   * Create new lead
   */
  async create(campaignId: string, data: CreateLeadData): Promise<Lead> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: Lead;
      }>(API_ENDPOINTS.LEADS(tenantId, campaignId), data);

      return response.data;
    } catch (error: any) {
      console.error('Create lead error:', error);
      throw new Error(error.error || 'Failed to create lead');
    }
  },

  /**
   * Bulk create leads
   */
  async createBulk(campaignId: string, leads: CreateLeadData[]): Promise<{ imported: number }> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.post<{
        success: boolean;
        data: { imported: number };
      }>(`${API_ENDPOINTS.LEADS(tenantId, campaignId)}/bulk`, { leads });

      return response.data;
    } catch (error: any) {
      console.error('Bulk create leads error:', error);
      throw new Error(error.error || 'Failed to create leads in bulk');
    }
  },

  /**
   * Upload leads from CSV
   */
  async uploadCSV(campaignId: string, file: File): Promise<{ imported: number }> {
    try {
      const tenantId = this.getTenantId();
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<{
        success: boolean;
        data: { imported: number };
      }>(API_ENDPOINTS.LEADS_UPLOAD(tenantId, campaignId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Upload CSV error:', error);
      throw new Error(error.error || 'Failed to upload CSV file');
    }
  },

  /**
   * Update lead
   */
  async update(campaignId: string, leadId: string, data: UpdateLeadData): Promise<Lead> {
    try {
      const tenantId = this.getTenantId();
      const response = await apiClient.put<{
        success: boolean;
        data: Lead;
      }>(API_ENDPOINTS.LEAD_BY_ID(tenantId, campaignId, leadId), data);

      return response.data;
    } catch (error: any) {
      console.error('Update lead error:', error);
      throw new Error(error.error || 'Failed to update lead');
    }
  },

  /**
   * Delete lead
   */
  async delete(campaignId: string, leadId: string): Promise<void> {
    try {
      const tenantId = this.getTenantId();
      await apiClient.delete(API_ENDPOINTS.LEAD_BY_ID(tenantId, campaignId, leadId));
    } catch (error: any) {
      console.error('Delete lead error:', error);
      throw new Error(error.error || 'Failed to delete lead');
    }
  },

  /**
   * Delete all leads for a campaign
   */
  async deleteAll(campaignId: string): Promise<void> {
    try {
      const tenantId = this.getTenantId();
      await apiClient.delete(API_ENDPOINTS.LEADS(tenantId, campaignId));
    } catch (error: any) {
      console.error('Delete all leads error:', error);
      throw new Error(error.error || 'Failed to delete all leads');
    }
  },
};

export default leadsService;
