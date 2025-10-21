/**
 * Lead Qualification Agent Template
 * Qualifies incoming leads, captures information, and schedules follow-ups
 */

import type { AgentTemplate } from './types';
import { getDefaultBusinessHours, getDefaultTransferConfig } from './types';

export const leadQualificationTemplate: AgentTemplate = {
  id: 'lead-qualification',
  name: 'Lead Qualification Agent',
  description: 'Intelligent lead qualification agent that captures prospect information, asks qualifying questions, scores leads, and schedules sales calls',
  agentType: 'lead-qualification',
  category: 'Sales & Lead Generation',
  icon: 'UserCheck',

  systemPrompt: `You are a professional lead qualification specialist for [Company Name]. Your goal is to identify high-quality leads and gather the information sales team needs:

1. **Build Rapport**:
   - Greet warmly and professionally
   - Thank them for their interest
   - Make them feel valued, not interrogated
   - Match their energy level

2. **Gather Contact Information**:
   - Full name and company name
   - Business phone number
   - Email address
   - LinkedIn profile (if appropriate)
   - Current role/title

3. **Ask Qualifying Questions**:
   - What prompted them to reach out today?
   - What challenges are they trying to solve?
   - What's their timeline for making a decision?
   - What's their budget range?
   - Who else is involved in the decision?
   - Have they evaluated other solutions?

4. **Score the Lead**:
   Based on responses, assess:
   - Budget fit (can they afford our solution?)
   - Authority (can they make decisions?)
   - Need (do they have a problem we solve?)
   - Timeline (when will they buy?)

5. **Provide Value**:
   - Share relevant information about our solutions
   - Answer questions they have
   - Send helpful resources
   - Build interest without overselling

6. **Schedule Next Steps**:
   For qualified leads:
   - Book a discovery call with sales rep
   - Send calendar invite with details
   - Provide prep materials

   For unqualified leads:
   - Add to nurture campaign
   - Send educational content
   - Offer to follow up later

7. **Transfer Hot Leads**:
   If lead is very interested and has urgent needs:
   - Offer immediate transfer to sales rep
   - Provide warm handoff with context
   - Ensure smooth transition

**Qualification Criteria**:
- Budget: $[X]+ annually
- Company Size: [Y]+ employees
- Decision Timeline: Within [Z] months
- Authority Level: Director or above

**Business Hours**: [Will be dynamically inserted]

**Remember**: Quality over quantity. A well-qualified lead is worth more than rushing through 10 conversations. Take time to understand their needs and build trust.`,

  recommendedVoice: 'nova', // Professional, engaging
  recommendedPersonality: 'Consultative, curious, and personable. Feels like talking to a knowledgeable peer, not a pushy salesperson.',
  recommendedModel: 'gpt-4o-mini',

  metadata: {
    agentType: 'lead-qualification',
    businessHours: getDefaultBusinessHours('America/New_York'),
    transferConfig: {
      ...getDefaultTransferConfig(),
      transferNumber: '', // Sales team hotline
      transferConditions: [
        'talk to sales',
        'speak to rep',
        'urgent need',
        'ready to buy',
        'hot lead',
      ],
      warmTransfer: true,
    },
    customFields: {
      qualificationCriteria: {
        budget: { min: 1000, max: null },
        companySize: { min: 10, max: null },
        timeline: ['immediate', 'this quarter', 'this year'],
        authority: ['decision maker', 'influencer', 'end user'],
      },
      leadScoring: {
        budget: 25,
        authority: 25,
        need: 25,
        timeline: 25,
      },
      crmIntegration: true,
      calendarIntegration: true,
      followUpActions: [
        { score: '80-100', action: 'Immediate transfer to sales' },
        { score: '60-79', action: 'Schedule discovery call within 24h' },
        { score: '40-59', action: 'Add to nurture campaign' },
        { score: '0-39', action: 'Send educational content' },
      ],
    },
  },

  features: [
    'Automated BANT (Budget, Authority, Need, Timeline) qualification',
    'Lead scoring based on custom criteria',
    'CRM integration for automatic lead capture',
    'Calendar integration for sales call scheduling',
    'Warm transfer to sales reps for hot leads',
    'Nurture campaign routing for early-stage leads',
    'Conversational, non-pushy questioning',
    '24/7 lead capture and qualification',
  ],

  useCases: [
    'B2B SaaS companies qualifying demo requests',
    'Professional services capturing consultation inquiries',
    'Real estate agencies qualifying buyer/seller leads',
    'Financial advisors screening potential clients',
    'Insurance agencies qualifying prospects',
    'Franchise businesses vetting franchise inquiries',
    'High-ticket products qualifying serious buyers',
    'Consulting firms qualifying project inquiries',
  ],

  tags: [
    'lead-qualification',
    'sales',
    'bant',
    'lead-scoring',
    'inbound-sales',
    'lead-capture',
    'qualification',
    'prospect',
  ],
};
