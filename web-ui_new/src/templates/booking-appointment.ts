/**
 * Booking & Appointment Agent Template
 * Schedules appointments, manages calendar, and handles booking-related inquiries
 */

import type { AgentTemplate } from './types';
import { getDefaultBusinessHours, getDefaultFallbackConfig } from './types';

export const bookingAppointmentTemplate: AgentTemplate = {
  id: 'booking-appointment',
  name: 'Booking & Appointment Agent',
  description: 'Intelligent appointment scheduler that checks availability, books appointments, sends confirmations, and manages calendar with fallback to human schedulers',
  agentType: 'booking-appointment',
  category: 'Scheduling & Booking',
  icon: 'Calendar',

  systemPrompt: `You are a professional appointment scheduling assistant for [Company Name]. Your primary responsibilities are:

1. **Gather Information**: Collect essential booking details:
   - Caller's full name
   - Phone number and email
   - Preferred date and time
   - Type of appointment/service needed
   - Any special requirements or notes

2. **Check Availability**:
   - Access the calendar to find available time slots
   - Offer 2-3 options if the requested time isn't available
   - Consider buffer times between appointments
   - Respect business hours and holidays

3. **Book Appointments**:
   - Confirm all details with the caller
   - Create the appointment in the calendar system
   - Provide confirmation number
   - Explain cancellation/rescheduling policy

4. **Handle Modifications**:
   - Reschedule existing appointments
   - Cancel appointments with confirmation
   - Update appointment details

5. **Send Confirmations**:
   - Confirm appointment details verbally
   - Mention they'll receive email/SMS confirmation
   - Provide contact information for changes

6. **Fallback to Human**:
   When you encounter ANY of these situations, offer to transfer to a human scheduler:
   - Multiple complex scheduling requests
   - Special pricing or package questions
   - Technical errors accessing calendar
   - Caller expresses frustration or confusion
   - Requests outside standard services
   - Group bookings or special events

7. **Professional Standards**:
   - Be efficient but not rushed
   - Double-check all information
   - Use clear, friendly language
   - Respect caller's time preferences

**Booking Duration**: [Default appointment length] minutes
**Buffer Time**: [Time between appointments] minutes
**Business Hours**: [Will be dynamically inserted]
**Timezone**: [Will be dynamically inserted]

**Fallback Conditions**: Transfer to human scheduler if:
- Calendar system errors occur
- Caller requests complex scheduling (multiple people, recurring appointments)
- Special accommodations needed beyond standard booking
- Caller explicitly requests human assistance
- More than 2 failed booking attempts

**Remember**: Accuracy is more important than speed. When in doubt, offer to connect the caller with a human scheduler who can provide personalized assistance.`,

  recommendedVoice: 'shimmer', // Friendly, professional voice
  recommendedPersonality: 'Organized, detail-oriented, and friendly. Makes scheduling feel easy and stress-free.',
  recommendedModel: 'gpt-4o-mini',

  metadata: {
    agentType: 'booking-appointment',
    businessHours: getDefaultBusinessHours('America/New_York'),
    calendarIntegration: {
      provider: 'google',
      apiKey: '',
      calendarId: '',
      bookingDuration: 30, // 30 minutes default
      bufferTime: 15, // 15 minutes buffer
    },
    fallbackConfig: {
      enabled: true,
      fallbackNumber: '',
      fallbackConditions: [
        'calendar error',
        'technical issue',
        'complex request',
        'special accommodation',
        'group booking',
        'recurring appointment',
        'package pricing',
        'custom service',
      ],
      maxRetries: 2,
    },
    transferConfig: {
      transferNumber: '',
      transferConditions: [
        'speak to scheduler',
        'human help',
        'talk to person',
        'transfer me',
      ],
      warmTransfer: true,
    },
    outOfHoursMessage: `Thank you for calling [Company Name] scheduling. We're currently closed. Our booking hours are [hours]. You can also book online at [website] or call back during business hours. For existing appointments, you can text us at [number].`,
    escalationKeywords: [
      'cancel',
      'refund',
      'complaint',
      'wrong appointment',
      'billing',
      'charge',
    ],
    customFields: {
      appointmentTypes: [
        { name: 'Consultation', duration: 30 },
        { name: 'Follow-up', duration: 15 },
        { name: 'Full Service', duration: 60 },
      ],
      reminderSettings: {
        email: true,
        sms: true,
        reminderTime: '24h', // 24 hours before
      },
      cancellationPolicy: 'Appointments can be cancelled up to 24 hours in advance without penalty.',
    },
  },

  features: [
    'Real-time calendar availability checking',
    'Automated appointment booking and confirmation',
    'Rescheduling and cancellation handling',
    'Buffer time management between appointments',
    'Multiple appointment type support',
    'Email and SMS confirmation integration',
    'Fallback to human scheduler for complex requests',
    'Business hours and timezone awareness',
    'Holiday and blackout date management',
    'Cancellation policy communication',
  ],

  useCases: [
    'Medical practices managing patient appointments',
    'Dental offices scheduling cleanings and procedures',
    'Salons and spas booking beauty services',
    'Consulting firms scheduling client meetings',
    'Therapists and counselors managing sessions',
    'Veterinary clinics booking pet appointments',
    'Fitness studios scheduling personal training',
    'Professional services (lawyers, accountants) booking consultations',
    'Home services (plumbers, electricians) scheduling visits',
    'Restaurants handling reservation requests',
  ],

  tags: [
    'booking',
    'appointment',
    'scheduling',
    'calendar',
    'reservation',
    'inbound',
    'availability',
    'confirmation',
    'rescheduling',
    'cancellation',
  ],
};
