/**
 * API Configuration
 * Central configuration for backend API connection
 */

// API Base URL from environment variables
// Production: https://voice-agent-backend-849423861855.us-central1.run.app/api/v1
// Development: http://localhost:3000/api/v1
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// API Timeout (30 seconds)
export const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10);

// Feature flag to switch between mock and real API
export const USE_REAL_API = process.env.NEXT_PUBLIC_USE_REAL_API === 'true';

// API configuration object
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  useRealAPI: USE_REAL_API,
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'sip_auth_token',
  USER_DATA: 'sip_user_data',
  TENANT_ID: 'sip_tenant_id',
  SELECTED_TENANT: 'sip_selected_tenant', // For system admins to select which tenant to manage
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // Tenants
  TENANTS: '/tenants',
  TENANT_BY_ID: (id: string) => `/tenants/${id}`,

  // Campaigns
  CAMPAIGNS: (tenantId: string) => `/tenants/${tenantId}/campaigns`,
  CAMPAIGN_BY_ID: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}`,
  CAMPAIGN_START: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/start`,
  CAMPAIGN_PAUSE: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/pause`,
  CAMPAIGN_RESUME: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/resume`,
  CAMPAIGN_STOP: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/stop`,
  CAMPAIGN_STATS: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/stats`,
  CAMPAIGN_TEST_CALL: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/test-call`,

  // Leads
  LEADS: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/leads`,
  LEAD_BY_ID: (tenantId: string, campaignId: string, leadId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/leads/${leadId}`,
  LEADS_UPLOAD: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/leads/upload`,
  LEAD_CALL_HISTORY: (tenantId: string, campaignId: string, leadId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/leads/${leadId}/call-history`,

  // Agents
  AGENTS: '/agents',
  AGENT_BY_ID: (id: string) => `/agents/${id}`,
  AGENT_LOAD_STATS: '/agents/load-stats',

  // Local Agents (Heartbeat tracking)
  LOCAL_AGENTS: '/local-agents',
  LOCAL_AGENT_BY_ID: (agentId: string) => `/local-agents/${agentId}`,
  LOCAL_AGENTS_CLEANUP: '/local-agents/cleanup-stale',

  // Phone Numbers
  PHONE_NUMBERS: (tenantId: string) => `/tenants/${tenantId}/phone-numbers`,
  PHONE_NUMBER_BY_ID: (tenantId: string, id: string) => `/tenants/${tenantId}/phone-numbers/${id}`,
  PHONE_NUMBER_PURCHASE: (tenantId: string) => `/tenants/${tenantId}/phone-numbers/purchase`,
  PHONE_NUMBER_AVAILABLE: (tenantId: string) => `/tenants/${tenantId}/phone-numbers/available`,

  // SIP Trunks
  SIP_TRUNKS: '/livekit-trunks',
  SIP_TRUNK_BY_ID: (id: string) => `/livekit-trunks/${id}`,

  // Call Logs
  CALL_LOGS: (tenantId: string, campaignId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/call-logs`,
  CALL_LOG_BY_ID: (tenantId: string, campaignId: string, logId: string) => `/tenants/${tenantId}/campaigns/${campaignId}/call-logs/${logId}`,

  // LiveKit Trunks
  LIVEKIT_TRUNKS: '/livekit-trunks',
  LIVEKIT_TRUNK_BY_ID: (id: string) => `/livekit-trunks/${id}`,

  // Platform Trunks
  PLATFORM_TRUNKS: '/platform-trunks',
  PLATFORM_TRUNK_BY_ID: (id: string) => `/platform-trunks/${id}`,
};

export default apiConfig;
