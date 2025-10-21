/**
 * Speech-to-Text (STT) Providers Configuration
 * Real STT providers supported by LiveKit Agents Framework
 * Based on 2025 benchmarks and LiveKit documentation
 */

export interface STTModel {
  id: string;
  name: string;
  description: string;
  languages: string[];
  languageCount: number;
  latency: string;
  accuracy: 'excellent' | 'very-good' | 'good';
  recommended?: boolean;
}

export interface STTProvider {
  id: string;
  name: string;
  label: string;
  description: string;
  avgLatency: string;
  languageSupport: number;
  costLevel: '$' | '$$' | '$$$';
  recommended?: boolean;
  features: string[];
  models: STTModel[];
  bestFor: string[];
}

/**
 * AssemblyAI Models
 * Best-in-class for multilingual transcription
 */
export const ASSEMBLYAI_MODELS: STTModel[] = [
  {
    id: 'universal-streaming',
    name: 'Universal-Streaming',
    description: 'Real-time streaming transcription with best-in-class accuracy',
    languages: [
      'English (Global)', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      'Dutch', 'Hindi', 'Japanese', 'Chinese', 'Finnish', 'Korean', 'Polish',
      'Russian', 'Turkish', 'Ukrainian', 'Vietnamese', 'Arabic', 'Czech',
      'Danish', 'Greek', 'Hebrew', 'Hungarian', 'Indonesian', 'Malay', 'Norwegian',
      'Romanian', 'Slovak', 'Swedish', 'Thai', 'Catalan', 'Croatian', 'Slovenian',
      'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi',
      'Punjabi', 'Urdu', 'Bulgarian', 'Estonian', 'Galician', 'Icelandic',
      'Latvian', 'Lithuanian', 'Macedonian', 'Serbian', 'Welsh', 'Afrikaans',
      'Albanian', 'Amharic', 'Armenian', 'Azerbaijani', 'Basque', 'Belarusian',
      'Bosnian', 'Burmese', 'Cebuano', 'Esperanto', 'Filipino', 'Georgian',
      'Hausa', 'Javanese', 'Kazakh', 'Khmer', 'Lao', 'Luxembourgish', 'Maltese',
      'Mongolian', 'Nepali', 'Pashto', 'Persian', 'Samoan', 'Shona', 'Sindhi',
      'Sinhala', 'Somali', 'Sundanese', 'Swahili', 'Tajik', 'Turkmen', 'Uzbek',
      'Xhosa', 'Yiddish', 'Yoruba', 'Zulu',
    ],
    languageCount: 99,
    latency: '307ms median',
    accuracy: 'excellent',
    recommended: true,
  },
  {
    id: 'universal-1',
    name: 'Universal-1',
    description: 'Batch transcription model trained on 12.5M+ hours of audio',
    languages: [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      'Dutch', 'Hindi', 'Japanese', 'Chinese', 'Finnish', 'Korean', 'Polish',
      'Russian', 'Turkish', 'Ukrainian', 'Vietnamese', '90+ more languages',
    ],
    languageCount: 99,
    latency: 'Batch processing',
    accuracy: 'excellent',
  },
];

/**
 * Deepgram Models
 * Best for speed and English-focused applications
 */
export const DEEPGRAM_MODELS: STTModel[] = [
  {
    id: 'nova-3',
    name: 'Nova-3',
    description: 'Latest Nova model with enhanced accuracy and speed',
    languages: [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      'Dutch', 'Hindi', 'Japanese', 'Chinese', 'Korean', 'Russian',
      'Turkish', 'Ukrainian', 'Swedish', 'Danish', 'Norwegian', 'Finnish',
      'Polish', 'Czech', 'Romanian', 'Greek', 'Indonesian', 'Malay',
      'Thai', 'Vietnamese', 'Arabic', 'Hebrew', 'Bulgarian', 'Croatian',
      'Slovak', 'Slovenian', 'Estonian', 'Latvian', 'Lithuanian',
      'Serbian', 'Catalan', 'Filipino', 'Bengali', 'Tamil',
      'Telugu', 'Gujarati', 'Marathi', 'Urdu', 'Nepali',
      'Sinhala', 'Burmese', 'Afrikaans', 'Icelandic', 'Georgian',
    ],
    languageCount: 50,
    latency: '516ms median',
    accuracy: 'very-good',
    recommended: true,
  },
  {
    id: 'nova-2',
    name: 'Nova-2',
    description: 'Previous generation Nova model, still highly accurate',
    languages: [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      '40+ more languages',
    ],
    languageCount: 46,
    latency: '550ms median',
    accuracy: 'very-good',
  },
  {
    id: 'base',
    name: 'Base',
    description: 'Original Deepgram model, optimized for English',
    languages: ['English'],
    languageCount: 1,
    latency: '450ms median',
    accuracy: 'good',
  },
];

/**
 * Google Cloud STT Models
 * Integrated with Google ecosystem
 */
export const GOOGLE_STT_MODELS: STTModel[] = [
  {
    id: 'chirp-2',
    name: 'Chirp 2',
    description: 'Latest Google STT model with improved accuracy',
    languages: [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      'Chinese', 'Japanese', 'Korean', 'Hindi', '100+ more languages',
    ],
    languageCount: 110,
    latency: '~400ms',
    accuracy: 'very-good',
  },
  {
    id: 'latest_long',
    name: 'Latest Long',
    description: 'Optimized for long-form content',
    languages: [
      'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
      '100+ more languages',
    ],
    languageCount: 110,
    latency: 'Batch processing',
    accuracy: 'very-good',
  },
];

/**
 * All STT Providers Configuration
 */
export const STT_PROVIDERS: STTProvider[] = [
  {
    id: 'assemblyai',
    name: 'AssemblyAI',
    label: '🎯 AssemblyAI',
    description: 'Best-in-class accuracy across 99+ languages',
    avgLatency: '307ms',
    languageSupport: 99,
    costLevel: '$$',
    recommended: true,
    features: [
      '99+ languages supported',
      'Fastest median latency (307ms)',
      'Best accuracy for English, Spanish, French, German',
      'Real-time streaming',
      'Speaker diarization',
      'Sentiment analysis',
    ],
    models: ASSEMBLYAI_MODELS,
    bestFor: [
      'Multilingual environments',
      'Customer service (multiple languages)',
      'High accuracy requirements',
      'Global businesses',
    ],
  },
  {
    id: 'deepgram',
    name: 'Deepgram',
    label: '⚡ Deepgram',
    description: 'Ultra-fast with excellent English performance',
    avgLatency: '516ms',
    languageSupport: 50,
    costLevel: '$$',
    features: [
      '50+ languages supported',
      'Optimized for speed',
      'Nova-3 model with enhanced accuracy',
      'Real-time streaming',
      'Custom vocabulary',
      'Profanity filtering',
    ],
    models: DEEPGRAM_MODELS,
    bestFor: [
      'English-focused applications',
      'Real-time performance critical',
      'Contact centers (English)',
      'Speed over language variety',
    ],
  },
  {
    id: 'google',
    name: 'Google Cloud',
    label: '🔮 Google Cloud STT',
    description: 'Integrated Google ecosystem, 110+ languages',
    avgLatency: '~400ms',
    languageSupport: 110,
    costLevel: '$$$',
    features: [
      '110+ languages supported',
      'Chirp 2 model',
      'Google ecosystem integration',
      'Auto punctuation',
      'Profanity filtering',
      'Word-level timestamps',
    ],
    models: GOOGLE_STT_MODELS,
    bestFor: [
      'Google Cloud users',
      'Wide language coverage',
      'Enterprise integration',
      'GCP ecosystem',
    ],
  },
];

/**
 * Default STT provider and model
 */
export const DEFAULT_STT_PROVIDER = 'assemblyai';
export const DEFAULT_STT_MODEL = 'universal-streaming';

/**
 * Helper functions
 */
export function getSTTProviderById(providerId: string): STTProvider | undefined {
  return STT_PROVIDERS.find(p => p.id === providerId);
}

export function getSTTModelById(providerId: string, modelId: string): STTModel | undefined {
  const provider = getSTTProviderById(providerId);
  return provider?.models.find(m => m.id === modelId);
}

export function getSTTModelsByProvider(providerId: string): STTModel[] {
  const provider = getSTTProviderById(providerId);
  return provider?.models || [];
}

export function filterSTTProvidersByLanguage(language: string): STTProvider[] {
  return STT_PROVIDERS.filter(provider => {
    return provider.models.some(model =>
      model.languages.some(lang =>
        lang.toLowerCase().includes(language.toLowerCase())
      )
    );
  });
}

/**
 * Language support comparison
 */
export function getLanguageSupportComparison(): Record<string, number> {
  return STT_PROVIDERS.reduce((acc, provider) => {
    acc[provider.name] = provider.languageSupport;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get recommended provider based on use case
 */
export function getRecommendedSTTProvider(criteria: {
  multilingual?: boolean;
  speedCritical?: boolean;
  primaryLanguage?: string;
}): STTProvider | undefined {
  if (criteria.multilingual) {
    return getSTTProviderById('assemblyai');
  }
  if (criteria.speedCritical && criteria.primaryLanguage?.toLowerCase() === 'english') {
    return getSTTProviderById('deepgram');
  }
  if (criteria.primaryLanguage && criteria.primaryLanguage.toLowerCase() !== 'english') {
    return getSTTProviderById('assemblyai');
  }
  // Default recommendation
  return getSTTProviderById('assemblyai');
}
