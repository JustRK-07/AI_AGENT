/**
 * Agent Template Types
 * Defines the structure for inbound voice agent templates
 */

export type AgentType =
  | 'greeting-transfer'
  | 'booking-appointment'
  | 'customer-support'
  | 'lead-qualification'
  | 'order-status'
  | 'after-hours';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface BusinessHours {
  timezone: string; // e.g., "America/New_York"
  schedule: Partial<Record<DayOfWeek, string>>; // e.g., { monday: "9:00-17:00" }
  holidays?: string[]; // ISO dates for holidays
}

export interface TransferConfig {
  transferNumber?: string; // Phone number for live agent
  transferConditions?: string[]; // Keywords or conditions that trigger transfer
  warmTransfer?: boolean; // Whether to provide context to receiving agent
  maxWaitTime?: number; // Max seconds before auto-transfer
}

export interface FallbackConfig {
  enabled: boolean;
  fallbackNumber?: string; // Different from transfer - for technical failures
  fallbackConditions?: string[]; // Conditions that trigger fallback
  maxRetries?: number; // Max AI attempts before fallback
}

export interface CalendarIntegration {
  provider?: 'google' | 'outlook' | 'calendly' | 'cal.com';
  apiKey?: string;
  calendarId?: string;
  bookingDuration?: number; // Default minutes
  bufferTime?: number; // Minutes between appointments
}

export interface TemplateMetadata {
  agentType: AgentType;
  businessHours?: BusinessHours;
  transferConfig?: TransferConfig;
  fallbackConfig?: FallbackConfig;
  calendarIntegration?: CalendarIntegration;
  outOfHoursMessage?: string;
  greetingScript?: string;
  escalationKeywords?: string[]; // Words that trigger escalation
  customFields?: Record<string, any>; // Template-specific extras
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  agentType: AgentType;
  category: string;
  icon: string; // Icon name from lucide-react
  systemPrompt: string;
  recommendedVoice?: string;
  recommendedPersonality?: string;
  recommendedModel?: string;
  metadata: TemplateMetadata;
  features: string[]; // Key features of this template
  useCases: string[]; // Example use cases
  tags: string[]; // Searchable tags
}

export interface TemplateLibrary {
  templates: AgentTemplate[];
  categories: string[];
}

// Helper function to create default business hours (9-5 weekdays)
export function getDefaultBusinessHours(timezone: string = 'America/New_York'): BusinessHours {
  return {
    timezone,
    schedule: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
    },
  };
}

// Helper function to create default transfer config
export function getDefaultTransferConfig(): TransferConfig {
  return {
    transferNumber: '',
    transferConditions: ['speak to human', 'talk to person', 'real agent', 'supervisor'],
    warmTransfer: true,
    maxWaitTime: 180, // 3 minutes
  };
}

// Helper function to create default fallback config
export function getDefaultFallbackConfig(): FallbackConfig {
  return {
    enabled: true,
    fallbackNumber: '',
    fallbackConditions: ['technical error', 'cannot help', 'too complex'],
    maxRetries: 2,
  };
}
