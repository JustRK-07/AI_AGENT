/**
 * Order Status & Tracking Agent Template
 * Provides order updates, tracking information, and handles order-related inquiries
 */

import type { AgentTemplate } from './types';
import { getDefaultBusinessHours, getDefaultTransferConfig, getDefaultFallbackConfig } from './types';

export const orderStatusTemplate: AgentTemplate = {
  id: 'order-status',
  name: 'Order Status & Tracking Agent',
  description: 'Customer-friendly agent that provides real-time order status, tracking updates, and handles returns, exchanges, and order modifications',
  agentType: 'order-status',
  category: 'E-commerce & Fulfillment',
  icon: 'Package',

  systemPrompt: `You are a helpful order management specialist for [Company Name]. Your role is to assist customers with their orders:

1. **Identify the Customer**:
   - Ask for order number or email address
   - Verify customer identity with last 4 digits of phone/zip
   - Pull up order details from system

2. **Provide Order Status**:
   - Current status (processing, shipped, out for delivery, etc.)
   - Estimated delivery date
   - Tracking information
   - Carrier details
   - Any delays or issues

3. **Handle Common Requests**:
   - **Tracking Updates**: Provide latest tracking information
   - **Delivery Address**: Confirm or update delivery address (if not yet shipped)
   - **Order Changes**: Modify items (if not yet shipped)
   - **Delivery Issues**: Report missing, damaged, or incorrect items
   - **Returns**: Initiate return process and provide return label
   - **Exchanges**: Process exchanges for different size/color/item

4. **Troubleshoot Issues**:
   - Package marked delivered but not received
   - Tracking not updating
   - Expected delivery date passed
   - Wrong item received
   - Damaged shipment
   - Missing items

5. **Escalate Complex Issues**:
   Transfer to human support for:
   - Refund requests over $[amount]
   - Billing disputes
   - Complex return situations
   - Lost packages requiring investigation
   - Damaged items needing replacement approval
   - Warranty claims

6. **Proactive Communication**:
   - Set clear expectations on resolution timeline
   - Provide case/ticket number for follow-up
   - Confirm email updates will be sent
   - Thank customer for their patience

**Business Hours**: [Will be dynamically inserted]
**Order System Integration**: [API details]

**Remember**: Customers calling about orders often have concerns or frustrations. Be empathetic, provide clear information, and take ownership of finding solutions.`,

  recommendedVoice: 'shimmer', // Friendly, reassuring
  recommendedPersonality: 'Helpful, detail-oriented, and reassuring. Makes customers feel confident their order is being handled properly.',
  recommendedModel: 'gpt-4o-mini',

  metadata: {
    agentType: 'order-status',
    businessHours: getDefaultBusinessHours('America/New_York'),
    transferConfig: {
      ...getDefaultTransferConfig(),
      transferConditions: [
        'speak to manager',
        'refund',
        'charge incorrect',
        'fraud',
        'dispute',
      ],
    },
    fallbackConfig: {
      ...getDefaultFallbackConfig(),
      fallbackConditions: [
        'refund over limit',
        'billing dispute',
        'lost package investigation',
        'damaged item replacement',
        'warranty claim',
        'system error',
      ],
    },
    escalationKeywords: [
      'refund',
      'lawsuit',
      'chargeback',
      'fraud',
      'stolen',
      'unacceptable',
      'better business bureau',
    ],
    customFields: {
      orderSystemIntegration: {
        provider: 'shopify', // or 'woocommerce', 'magento', etc.
        apiEndpoint: '',
        webhooks: true,
      },
      shippingCarriers: ['USPS', 'UPS', 'FedEx', 'DHL'],
      returnWindow: 30, // days
      refundPolicy: 'Full refund within 30 days, item must be unused',
      autoActions: {
        trackingLookup: true,
        returnLabelGeneration: true,
        addressModification: true, // If not shipped yet
        orderCancellation: true, // If not shipped yet
      },
    },
  },

  features: [
    'Real-time order status lookup',
    'Automatic tracking number retrieval',
    'Shipment tracking across carriers',
    'Return label generation',
    'Address modification (pre-shipment)',
    'Order cancellation handling',
    'Delivery issue troubleshooting',
    'Exchange and return processing',
    'Proactive order updates',
    'Integration with major e-commerce platforms',
  ],

  useCases: [
    'E-commerce stores handling order inquiries',
    'Retail companies with online and offline orders',
    'Subscription box services managing recurring shipments',
    'Dropshipping businesses tracking supplier shipments',
    'Wholesale distributors providing B2B order updates',
    'Direct-to-consumer brands managing fulfillment',
    'Marketplaces coordinating multi-vendor orders',
    'Food delivery services providing order tracking',
  ],

  tags: [
    'order-status',
    'tracking',
    'e-commerce',
    'fulfillment',
    'returns',
    'exchanges',
    'shipping',
    'delivery',
  ],
};
