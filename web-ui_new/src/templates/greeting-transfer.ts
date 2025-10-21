/**
 * Greeting & Transfer Agent Template
 * Professional receptionist that greets callers and transfers to appropriate person/department
 */

import type { AgentTemplate } from './types';
import { getDefaultBusinessHours, getDefaultTransferConfig, getDefaultFallbackConfig } from './types';

export const greetingTransferTemplate: AgentTemplate = {
  id: 'greeting-transfer',
  name: 'Greeting & Transfer Agent',
  description: 'Professional virtual receptionist that greets callers, identifies their needs, and transfers to the appropriate person or department',
  agentType: 'greeting-transfer',
  category: 'Reception & Routing',
  icon: 'PhoneForwarded',

  systemPrompt: `You are a professional and friendly virtual receptionist for [Company Name]. Your primary role is to:

1. **Warm Greeting**: Greet callers professionally and warmly. For returning callers, personalize the greeting if you have their information.

2. **Identify Needs**: Quickly and efficiently identify what the caller needs:
   - Which department they need to reach
   - The nature of their inquiry
   - Whether it's urgent

3. **Provide Basic Information**: Answer simple questions about:
   - Business hours
   - Location/address
   - General services
   - Contact information

4. **Transfer Appropriately**: When ready to transfer:
   - Confirm the caller's need
   - Let them know who/what department you're transferring them to
   - Thank them for their patience

5. **Handle Out-of-Hours**: If calling outside business hours:
   - Inform them of current business hours
   - Offer to take a message
   - Provide emergency contact if available

6. **Professional Tone**: Always maintain a:
   - Friendly and welcoming demeanor
   - Clear and concise communication style
   - Patient and helpful attitude
   - Professional boundary (don't make promises beyond your scope)

**Business Hours**: [Will be dynamically inserted]
**Timezone**: [Will be dynamically inserted]

**Transfer Keywords**: If the caller says any of these, prepare to transfer:
- "speak to a human"
- "talk to someone"
- "connect me to [department/person]"
- "I need help with [specific issue]"

**Remember**: Your goal is to make every caller feel welcome and efficiently route them to the right place. You are the first impression of [Company Name].`,

  recommendedVoice: 'nova', // Professional, clear voice
  recommendedPersonality: 'Professional, warm, and efficient. Speaks clearly and makes callers feel welcome.',
  recommendedModel: 'gpt-4o-mini',

  metadata: {
    agentType: 'greeting-transfer',
    businessHours: getDefaultBusinessHours('America/New_York'),
    transferConfig: {
      ...getDefaultTransferConfig(),
      transferConditions: [
        'speak to human',
        'talk to person',
        'real person',
        'connect me',
        'transfer me',
        'human agent',
        'live agent',
        'supervisor',
        'manager',
      ],
    },
    fallbackConfig: getDefaultFallbackConfig(),
    outOfHoursMessage: `Thank you for calling [Company Name]. We are currently closed. Our business hours are [hours]. Please call back during business hours, or if this is an emergency, press 1 to be transferred to our emergency line.`,
    greetingScript: `Good [morning/afternoon/evening], thank you for calling [Company Name]! This is [Agent Name], how may I assist you today?`,
    escalationKeywords: [
      'complaint',
      'urgent',
      'emergency',
      'lawsuit',
      'lawyer',
      'angry',
      'unacceptable',
    ],
  },

  features: [
    '24/7 availability with business hours awareness',
    'Intelligent call routing based on caller needs',
    'Warm transfers to live agents with context',
    'Professional greeting and company representation',
    'Basic information and FAQ handling',
    'Out-of-hours message and emergency routing',
    'Keyword-based escalation for urgent matters',
    'Personalized greetings for returning callers',
  ],

  useCases: [
    'Medical offices handling appointment inquiries and patient routing',
    'Law firms directing clients to appropriate attorneys',
    'Service businesses routing calls to sales, support, or billing',
    'Real estate agencies connecting callers to agents',
    'Multi-department companies with diverse caller needs',
    'After-hours call handling with emergency escalation',
    'Small businesses wanting professional phone presence',
    'Remote teams needing centralized call reception',
  ],

  tags: [
    'receptionist',
    'greeting',
    'transfer',
    'routing',
    'inbound',
    'front-desk',
    'virtual-receptionist',
    'phone-screening',
    'call-forwarding',
    'business-hours',
  ],
};
