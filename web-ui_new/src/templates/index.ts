/**
 * Agent Templates Library
 * Central export for all inbound voice agent templates
 */

import type { AgentTemplate, TemplateLibrary } from './types';
import { greetingTransferTemplate } from './greeting-transfer';
import { bookingAppointmentTemplate } from './booking-appointment';
import { customerSupportTemplate } from './customer-support';
import { leadQualificationTemplate } from './lead-qualification';
import { orderStatusTemplate } from './order-status';
import { afterHoursTemplate } from './after-hours';

// Export all templates
export { greetingTransferTemplate } from './greeting-transfer';
export { bookingAppointmentTemplate } from './booking-appointment';
export { customerSupportTemplate } from './customer-support';
export { leadQualificationTemplate } from './lead-qualification';
export { orderStatusTemplate } from './order-status';
export { afterHoursTemplate } from './after-hours';

// Export types
export * from './types';

// Complete template library
export const templateLibrary: TemplateLibrary = {
  templates: [
    greetingTransferTemplate,
    bookingAppointmentTemplate,
    customerSupportTemplate,
    leadQualificationTemplate,
    orderStatusTemplate,
    afterHoursTemplate,
  ],
  categories: [
    'Reception & Routing',
    'Scheduling & Booking',
    'Support & Service',
    'Sales & Lead Generation',
    'E-commerce & Fulfillment',
    'Emergency & After-Hours',
  ],
};

// Helper function to get template by ID
export function getTemplateById(id: string): AgentTemplate | undefined {
  return templateLibrary.templates.find((t) => t.id === id);
}

// Helper function to get templates by category
export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return templateLibrary.templates.filter((t) => t.category === category);
}

// Helper function to search templates
export function searchTemplates(query: string): AgentTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templateLibrary.templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      t.useCases.some((uc) => uc.toLowerCase().includes(lowerQuery))
  );
}

// Helper function to get priority templates (for user's focus)
export function getPriorityTemplates(): AgentTemplate[] {
  return [
    greetingTransferTemplate, // Priority #1
    bookingAppointmentTemplate, // Priority #2
  ];
}
