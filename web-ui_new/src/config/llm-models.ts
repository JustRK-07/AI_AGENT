/**
 * LLM Models Configuration
 * Available real-time LLM providers and models for LiveKit Agents
 * Updated with 2025 token limits and performance metrics
 */

export interface LLMModel {
  value: string;
  label: string;
  description?: string;
  contextWindow?: number; // in tokens
  outputLimit?: number; // in tokens
  costLevel?: '$' | '$$' | '$$$' | '$$$$';
  bestFor?: string[];
  recommended?: boolean;
}

export interface LLMProvider {
  value: string;
  label: string;
  models: LLMModel[];
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    value: 'openai',
    label: '🤖 OpenAI',
    models: [
      {
        value: 'gpt-4o',
        label: 'GPT-4o',
        description: 'Most capable model for complex conversations',
        contextWindow: 128000,
        outputLimit: 4096,
        costLevel: '$$$',
        bestFor: [
          'Complex multi-turn conversations',
          'Context retention across long calls',
          'Nuanced understanding required',
          'Advanced reasoning tasks',
        ],
      },
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Fast, cost-effective, and reliable (recommended)',
        contextWindow: 128000,
        outputLimit: 4096,
        costLevel: '$',
        recommended: true,
        bestFor: [
          'Standard customer service calls',
          'High-volume applications',
          'Cost-conscious deployments',
          'Fast response times',
        ],
      },
      {
        value: 'gpt-4-turbo',
        label: 'GPT-4 Turbo',
        description: 'Balanced speed and capability',
        contextWindow: 128000,
        outputLimit: 4096,
        costLevel: '$$',
        bestFor: [
          'Business applications',
          'Moderate complexity conversations',
          'Balanced performance needs',
        ],
      },
    ],
  },
  {
    value: 'cerebras',
    label: '🧠 Cerebras',
    models: [
      {
        value: 'llama-3.3-70b',
        label: 'Llama 3.3 70B',
        description: 'Latest Llama model with excellent performance',
        contextWindow: 128000,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Open-source preference',
          'High performance on budget',
          'Customizable deployments',
        ],
      },
      {
        value: 'llama-3.1-70b',
        label: 'Llama 3.1 70B',
        description: 'Powerful open-source model',
        contextWindow: 128000,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Enterprise self-hosting',
          'Privacy-sensitive applications',
          'Cost control',
        ],
      },
      {
        value: 'llama-3.1-8b',
        label: 'Llama 3.1 8B',
        description: 'Fast and efficient smaller model',
        contextWindow: 128000,
        outputLimit: 8192,
        costLevel: '$',
        bestFor: [
          'Ultra-fast responses',
          'Simple conversations',
          'High-volume low-cost',
        ],
      },
    ],
  },
  {
    value: 'groq',
    label: '⚡ Groq',
    models: [
      {
        value: 'llama-3.3-70b-versatile',
        label: 'Llama 3.3 70B Versatile',
        description: 'Lightning-fast inference, versatile performance',
        contextWindow: 128000,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Real-time voice applications',
          'Low latency critical',
          'Balanced cost and performance',
        ],
      },
      {
        value: 'llama-3.1-70b-versatile',
        label: 'Llama 3.1 70B Versatile',
        description: 'Balanced performance with fast inference',
        contextWindow: 128000,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Standard voice agents',
          'Fast response needs',
          'Good cost-performance ratio',
        ],
      },
      {
        value: 'mixtral-8x7b-32768',
        label: 'Mixtral 8x7B',
        description: 'Mixture of experts model with large context',
        contextWindow: 32768,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Specialized knowledge domains',
          'Multi-expert reasoning',
          'Medium context requirements',
        ],
      },
    ],
  },
  {
    value: 'google',
    label: '🔮 Google',
    models: [
      {
        value: 'gemini-2.0-flash-exp',
        label: 'Gemini 2.0 Flash',
        description: 'Latest Gemini with massive 1M token context',
        contextWindow: 1000000,
        outputLimit: 8192,
        costLevel: '$$$',
        bestFor: [
          'Extremely long conversations',
          'Document analysis during calls',
          'Complex context retention',
          'Experimental cutting-edge features',
        ],
      },
      {
        value: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        description: 'Advanced reasoning with 2M token context',
        contextWindow: 2000000,
        outputLimit: 8192,
        costLevel: '$$$$',
        bestFor: [
          'Maximum context window needs',
          'Enterprise applications',
          'Complex multi-document analysis',
          'Premium performance',
        ],
      },
      {
        value: 'gemini-1.5-flash',
        label: 'Gemini 1.5 Flash',
        description: 'Fast and efficient with large context',
        contextWindow: 1000000,
        outputLimit: 8192,
        costLevel: '$$',
        bestFor: [
          'Fast voice agents',
          'Large context on budget',
          'Google ecosystem integration',
        ],
      },
    ],
  },
  {
    value: 'amazon',
    label: '🌐 Amazon',
    models: [
      {
        value: 'nova-sonic',
        label: 'Nova Sonic',
        description: 'Optimized for real-time voice applications',
        contextWindow: 32000,
        outputLimit: 4096,
        costLevel: '$$',
        bestFor: [
          'AWS ecosystem integration',
          'Real-time voice processing',
          'Enterprise AWS users',
        ],
      },
      {
        value: 'nova-pro',
        label: 'Nova Pro',
        description: 'Advanced Amazon model for complex tasks',
        contextWindow: 32000,
        outputLimit: 4096,
        costLevel: '$$$',
        bestFor: [
          'AWS enterprise customers',
          'Advanced capabilities needed',
          'Integrated AWS solutions',
        ],
      },
    ],
  },
];

export const DEFAULT_LLM_PROVIDER = 'openai';
export const DEFAULT_LLM_MODEL = 'gpt-4o-mini';

export function getModelsForProvider(provider: string): LLMModel[] {
  const providerConfig = LLM_PROVIDERS.find(p => p.value === provider);
  return providerConfig?.models || [];
}

export function getProviderLabel(provider: string): string {
  const providerConfig = LLM_PROVIDERS.find(p => p.value === provider);
  return providerConfig?.label || provider;
}

export function getModelLabel(provider: string, model: string): string {
  const models = getModelsForProvider(provider);
  const modelConfig = models.find(m => m.value === model);
  return modelConfig?.label || model;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
}

/**
 * Format tokens as approximate word count
 */
export function tokensToWords(tokens: number): string {
  // Rough estimate: 1 token ≈ 0.75 words
  const words = Math.floor(tokens * 0.75);
  if (words >= 1000) {
    return `~${(words / 1000).toFixed(0)}K words`;
  }
  return `~${words} words`;
}

/**
 * Get cost level description
 */
export function getCostLevelDescription(costLevel?: string): string {
  switch (costLevel) {
    case '$':
      return 'Very cost-effective';
    case '$$':
      return 'Moderate cost';
    case '$$$':
      return 'Premium pricing';
    case '$$$$':
      return 'Enterprise pricing';
    default:
      return 'Cost varies';
  }
}

/**
 * Get model by value across all providers
 */
export function getModelByValue(modelValue: string): LLMModel | undefined {
  for (const provider of LLM_PROVIDERS) {
    const model = provider.models.find(m => m.value === modelValue);
    if (model) return model;
  }
  return undefined;
}

/**
 * Get recommended model for use case
 */
export function getRecommendedModel(criteria: {
  costSensitive?: boolean;
  contextHeavy?: boolean;
  speedCritical?: boolean;
}): LLMModel | undefined {
  if (criteria.costSensitive) {
    return LLM_PROVIDERS[0].models.find(m => m.value === 'gpt-4o-mini');
  }
  if (criteria.contextHeavy) {
    return LLM_PROVIDERS[3].models.find(m => m.value === 'gemini-1.5-pro');
  }
  if (criteria.speedCritical) {
    return LLM_PROVIDERS[2].models.find(m => m.value === 'llama-3.3-70b-versatile');
  }
  // Default recommendation
  return LLM_PROVIDERS[0].models.find(m => m.value === 'gpt-4o-mini');
}
