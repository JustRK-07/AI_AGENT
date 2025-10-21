// Gobi Service - Mock data for UI only (no backend)

// Types
export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  type: 'INBOUND' | 'OUTBOUND';
  isActive: boolean;
  agentId: string | null;
  createdAt: string;
  updatedAt: string;
  agent?: Agent;
  phoneNumbers?: PhoneNumber[];
  leadLists?: LeadList[];
  _count?: {
    calls: number;
    phoneNumbers: number;
    leadLists: number;
  };
}

export interface PhoneNumber {
  id: string;
  number: string;
  provider: string;
  capabilities?: string[];
  isActive: boolean;
  campaignId: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: Campaign;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  prompt: string;
  model: string;
  voice: string;
  temperature: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DEPLOYING' | 'ERROR';
  deploymentMode: 'local' | 'livekit';
  createdAt: string;
  updatedAt: string;
  _count?: {
    campaigns: number;
    calls: number;
  };
}

export interface LeadList {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    leads: number;
    campaigns: number;
  };
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string;
  leadListId: string;
  metadata?: Record<string, any>;
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

// Create types
export interface CreateCampaignData {
  name: string;
  description?: string;
  type: 'INBOUND' | 'OUTBOUND';
  agentId?: string;
  phoneNumberIds?: string[];
  leadListIds?: string[];
}

export interface CreateAgentData {
  name: string;
  description?: string;
  prompt: string;
  model: string;
  voice: string;
  temperature: number;
  deploymentMode: 'local' | 'livekit';
}

export interface CreatePhoneNumberData {
  number: string;
  provider?: string;
}

export interface CreateLeadListData {
  name: string;
  description?: string;
}

export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  leadListId: string;
  metadata?: Record<string, any>;
}

// Mock data storage (in-memory)
let mockCampaigns: Campaign[] = [];
let mockPhoneNumbers: PhoneNumber[] = [];
let mockAgents: Agent[] = [];
let mockLeadLists: LeadList[] = [];
let mockLeads: Lead[] = [];

// Helper to simulate async delay
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Campaigns API
const campaigns = {
  getAll: async (): Promise<{ campaigns: Campaign[] }> => {
    await delay();
    return { campaigns: mockCampaigns };
  },

  getById: async (id: string): Promise<Campaign | null> => {
    await delay();
    return mockCampaigns.find(c => c.id === id) || null;
  },

  create: async (data: CreateCampaignData): Promise<Campaign> => {
    await delay();
    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      description: data.description || null,
      type: data.type,
      isActive: true,
      agentId: data.agentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { calls: 0, phoneNumbers: 0, leadLists: 0 },
    };
    mockCampaigns.push(newCampaign);
    return newCampaign;
  },

  update: async (id: string, data: Partial<Campaign>): Promise<Campaign> => {
    await delay();
    const index = mockCampaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      mockCampaigns[index] = { ...mockCampaigns[index], ...data, updatedAt: new Date().toISOString() };
      return mockCampaigns[index];
    }
    throw new Error('Campaign not found');
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    mockCampaigns = mockCampaigns.filter(c => c.id !== id);
  },
};

// Phone Numbers API
const numbers = {
  getAll: async (): Promise<{ phoneNumbers: PhoneNumber[] }> => {
    await delay();
    return { phoneNumbers: mockPhoneNumbers };
  },

  getById: async (id: string): Promise<PhoneNumber | null> => {
    await delay();
    return mockPhoneNumbers.find(n => n.id === id) || null;
  },

  getAvailable: async (criteria: {
    areaCode?: string;
    country?: string;
    contains?: string;
  }): Promise<{ availableNumbers: AvailablePhoneNumber[] }> => {
    await delay();
    // Return mock available numbers
    return {
      availableNumbers: [
        {
          phoneNumber: '+1234567890',
          locality: 'San Francisco',
          region: 'CA',
          postalCode: '94102',
          isoCountry: 'US',
          capabilities: { voice: true, SMS: true, MMS: true },
        },
      ],
    };
  },

  create: async (data: CreatePhoneNumberData): Promise<PhoneNumber> => {
    await delay();
    const newNumber: PhoneNumber = {
      id: Math.random().toString(36).substr(2, 9),
      number: data.number,
      provider: data.provider || 'twilio',
      isActive: true,
      campaignId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPhoneNumbers.push(newNumber);
    return newNumber;
  },

  update: async (id: string, data: Partial<PhoneNumber>): Promise<PhoneNumber> => {
    await delay();
    const index = mockPhoneNumbers.findIndex(n => n.id === id);
    if (index !== -1) {
      mockPhoneNumbers[index] = { ...mockPhoneNumbers[index], ...data, updatedAt: new Date().toISOString() };
      return mockPhoneNumbers[index];
    }
    throw new Error('Phone number not found');
  },

  delete: async (id: string, release: boolean = false): Promise<void> => {
    await delay();
    mockPhoneNumbers = mockPhoneNumbers.filter(n => n.id !== id);
  },

  getStats: async (): Promise<any> => {
    await delay();
    return {
      total: mockPhoneNumbers.length,
      active: mockPhoneNumbers.filter(n => n.isActive).length,
      inactive: mockPhoneNumbers.filter(n => !n.isActive).length,
      assigned: mockPhoneNumbers.filter(n => n.campaignId !== null).length,
      unassigned: mockPhoneNumbers.filter(n => n.campaignId === null).length,
    };
  },
};

// Agents API
const agents = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ agents: Agent[] }> => {
    await delay();
    return { agents: mockAgents };
  },

  getById: async (id: string): Promise<Agent | null> => {
    await delay();
    return mockAgents.find(a => a.id === id) || null;
  },

  getStats: async (): Promise<any> => {
    await delay();
    return {
      total: mockAgents.length,
      active: mockAgents.filter(a => a.status === 'ACTIVE').length,
      inactive: mockAgents.filter(a => a.status === 'INACTIVE').length,
    };
  },

  create: async (data: CreateAgentData): Promise<Agent> => {
    await delay();
    const newAgent: Agent = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      description: data.description || null,
      prompt: data.prompt,
      model: data.model,
      voice: data.voice,
      temperature: data.temperature,
      status: 'INACTIVE',
      deploymentMode: data.deploymentMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { campaigns: 0, calls: 0 },
    };
    mockAgents.push(newAgent);
    return newAgent;
  },

  update: async (id: string, data: Partial<Agent>): Promise<Agent> => {
    await delay();
    const index = mockAgents.findIndex(a => a.id === id);
    if (index !== -1) {
      mockAgents[index] = { ...mockAgents[index], ...data, updatedAt: new Date().toISOString() };
      return mockAgents[index];
    }
    throw new Error('Agent not found');
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    mockAgents = mockAgents.filter(a => a.id !== id);
  },

  deploy: async (id: string): Promise<void> => {
    await delay();
    const agent = mockAgents.find(a => a.id === id);
    if (agent) {
      agent.status = 'ACTIVE';
    }
  },

  stop: async (id: string): Promise<void> => {
    await delay();
    const agent = mockAgents.find(a => a.id === id);
    if (agent) {
      agent.status = 'INACTIVE';
    }
  },

  getTemplates: async (): Promise<any[]> => {
    await delay();
    // Return mock agent templates
    return [
      {
        id: 'template-1',
        name: 'Customer Support Agent',
        description: 'Handles customer inquiries and support requests',
        prompt: 'You are a helpful customer support agent. Be polite and professional.',
        model: 'gpt-4',
        voice: 'alloy',
        temperature: 0.7,
      },
      {
        id: 'template-2',
        name: 'Sales Agent',
        description: 'Engages customers and handles sales conversations',
        prompt: 'You are a friendly sales representative. Help customers find solutions.',
        model: 'gpt-4',
        voice: 'nova',
        temperature: 0.8,
      },
      {
        id: 'template-3',
        name: 'Appointment Scheduler',
        description: 'Schedules and manages appointments',
        prompt: 'You are an appointment scheduling assistant. Be efficient and clear.',
        model: 'gpt-3.5-turbo',
        voice: 'shimmer',
        temperature: 0.5,
      },
    ];
  },
};

// Lead Lists API
const leadLists = {
  getAll: async (): Promise<{ leadLists: LeadList[] }> => {
    await delay();
    return { leadLists: mockLeadLists };
  },

  getById: async (id: string): Promise<LeadList | null> => {
    await delay();
    return mockLeadLists.find(l => l.id === id) || null;
  },

  create: async (data: CreateLeadListData): Promise<LeadList> => {
    await delay();
    const newLeadList: LeadList = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      description: data.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: { leads: 0, campaigns: 0 },
    };
    mockLeadLists.push(newLeadList);
    return newLeadList;
  },

  update: async (id: string, data: Partial<LeadList>): Promise<LeadList> => {
    await delay();
    const index = mockLeadLists.findIndex(l => l.id === id);
    if (index !== -1) {
      mockLeadLists[index] = { ...mockLeadLists[index], ...data, updatedAt: new Date().toISOString() };
      return mockLeadLists[index];
    }
    throw new Error('Lead list not found');
  },

  delete: async (id: string): Promise<void> => {
    await delay();
    mockLeadLists = mockLeadLists.filter(l => l.id !== id);
  },
};

// Leads API
const leads = {
  getAll: async (leadListId: string): Promise<{ leads: Lead[] }> => {
    await delay();
    return { leads: mockLeads.filter(l => l.leadListId === leadListId) };
  },

  getById: async (leadListId: string, leadId: string): Promise<Lead | null> => {
    await delay();
    return mockLeads.find(l => l.id === leadId && l.leadListId === leadListId) || null;
  },

  create: async (data: CreateLeadData): Promise<Lead> => {
    await delay();
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phoneNumber: data.phoneNumber,
      leadListId: data.leadListId,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockLeads.push(newLead);
    return newLead;
  },

  update: async (leadListId: string, leadId: string, data: Partial<Lead>): Promise<Lead> => {
    await delay();
    const index = mockLeads.findIndex(l => l.id === leadId && l.leadListId === leadListId);
    if (index !== -1) {
      mockLeads[index] = { ...mockLeads[index], ...data, updatedAt: new Date().toISOString() };
      return mockLeads[index];
    }
    throw new Error('Lead not found');
  },

  delete: async (leadListId: string, leadId: string): Promise<void> => {
    await delay();
    mockLeads = mockLeads.filter(l => !(l.id === leadId && l.leadListId === leadListId));
  },

  bulkImport: async (leadListId: string, leads: Omit<CreateLeadData, 'leadListId'>[]): Promise<{ imported: number }> => {
    await delay();
    const newLeads = leads.map(leadData => ({
      id: Math.random().toString(36).substr(2, 9),
      ...leadData,
      email: leadData.email || null,
      leadListId,
      metadata: leadData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    mockLeads.push(...newLeads);
    return { imported: newLeads.length };
  },
};

// Export the service
export const gobiService = {
  campaigns,
  numbers,
  agents,
  leadLists,
  leads,
};

export default gobiService;
