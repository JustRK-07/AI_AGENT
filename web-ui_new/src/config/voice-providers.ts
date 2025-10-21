/**
 * Voice Providers Configuration
 * Real TTS providers supported by LiveKit Agents Framework
 * Based on 2025 market research and LiveKit documentation
 */

export interface Voice {
  id: string;
  name: string;
  description: string;
  language?: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
  previewUrl?: string;
  sampleText?: string;
  tags?: string[];
}

export interface VoiceProvider {
  id: string;
  name: string;
  label: string;
  description: string;
  latency: string;
  languages: number;
  voiceCount: string;
  costLevel: '$' | '$$' | '$$$' | '$$$$';
  recommended?: boolean;
  features: string[];
  voices: Voice[];
}

/**
 * OpenAI TTS Voices
 * 6 high-quality voices, simple and reliable
 */
export const OPENAI_VOICES: Voice[] = [
  {
    id: 'nova',
    name: 'Nova',
    description: 'Warm and professional, excellent for customer service',
    gender: 'female',
    sampleText: "Hello, I'm Nova. I have a warm and professional voice perfect for business communication.",
    tags: ['professional', 'warm', 'business'],
  },
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Neutral and clear, versatile for any use case',
    gender: 'neutral',
    sampleText: "Hi there, I'm Alloy. My voice is neutral and clear, making me versatile for any situation.",
    tags: ['neutral', 'clear', 'versatile'],
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Confident and strong, great for announcements',
    gender: 'male',
    sampleText: "Greetings, I'm Echo. I sound confident and strong, ideal for making important announcements.",
    tags: ['confident', 'strong', 'announcer'],
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'Engaging and expressive, perfect for storytelling',
    gender: 'female',
    sampleText: "Hello friend, I'm Fable. My voice is engaging and expressive, perfect for storytelling.",
    tags: ['engaging', 'expressive', 'storytelling'],
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Deep and authoritative, commanding presence',
    gender: 'male',
    sampleText: "Good day, I'm Onyx. I have a deep and authoritative tone that commands attention.",
    tags: ['deep', 'authoritative', 'commanding'],
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Friendly and energetic, upbeat conversations',
    gender: 'female',
    sampleText: "Hey! I'm Shimmer. I'm friendly and energetic, bringing positivity to every conversation!",
    tags: ['friendly', 'energetic', 'upbeat'],
  },
];

/**
 * Cartesia Sonic 2.0 Voices
 * 100+ ultra-realistic voices with 90ms latency
 */
export const CARTESIA_VOICES: Voice[] = [
  // Professional Business Voices
  {
    id: 'a0e99841-438c-4a64-b679-ae501e7d6091',
    name: 'British Customer Support',
    description: 'Professional British accent, perfect for customer service',
    gender: 'female',
    accent: 'British',
    language: 'English',
    tags: ['professional', 'customer-service', 'british', 'clear'],
  },
  {
    id: '79a125e8-cd45-4c13-8a67-188112f4dd22',
    name: 'American Business',
    description: 'Clear American accent, professional and trustworthy',
    gender: 'male',
    accent: 'American',
    language: 'English',
    tags: ['professional', 'business', 'trustworthy', 'american'],
  },
  {
    id: '2ee87190-8f84-4925-97da-e52547f9462c',
    name: 'Corporate Executive',
    description: 'Authoritative and polished, ideal for executive communication',
    gender: 'male',
    accent: 'American',
    language: 'English',
    tags: ['executive', 'authoritative', 'polished', 'corporate'],
  },
  {
    id: '41534374-4c4f-4800-a2c0-e1b2c9c3c7a4',
    name: 'Professional Narrator',
    description: 'Smooth narration voice, great for presentations',
    gender: 'female',
    accent: 'American',
    language: 'English',
    tags: ['narrator', 'smooth', 'presentation', 'professional'],
  },

  // Expressive & Friendly Voices
  {
    id: '694f9389-aac1-45b6-b726-9d9369183238',
    name: 'Friendly Assistant',
    description: 'Warm and approachable, perfect for customer interactions',
    gender: 'female',
    accent: 'American',
    language: 'English',
    tags: ['friendly', 'warm', 'approachable', 'assistant'],
  },
  {
    id: '820a3788-2b37-4d21-847a-b65d8a68c99a',
    name: 'Energetic Sales',
    description: 'Upbeat and enthusiastic, great for sales calls',
    gender: 'male',
    accent: 'American',
    language: 'English',
    tags: ['energetic', 'sales', 'enthusiastic', 'upbeat'],
  },
  {
    id: '87748186-23bb-4158-a1eb-332911b0b708',
    name: 'Conversational',
    description: 'Natural conversation style, casual and relatable',
    gender: 'female',
    accent: 'American',
    language: 'English',
    tags: ['conversational', 'casual', 'natural', 'relatable'],
  },

  // International Voices
  {
    id: '5619d38c-cf51-4d8e-9575-48f61a280413',
    name: 'Spanish Customer Service',
    description: 'Clear Spanish accent, professional customer support',
    gender: 'female',
    accent: 'Spanish',
    language: 'Spanish',
    tags: ['professional', 'spanish', 'customer-service', 'clear'],
  },
  {
    id: '9d0e9df0-dcab-4e85-8bb1-ed8b453bb7d8',
    name: 'French Business',
    description: 'Elegant French accent, sophisticated communication',
    gender: 'male',
    accent: 'French',
    language: 'French',
    tags: ['french', 'elegant', 'sophisticated', 'business'],
  },
  {
    id: '63ff761f-c1e8-414b-b969-d1833d1c870c',
    name: 'German Professional',
    description: 'Clear German accent, precise and professional',
    gender: 'female',
    accent: 'German',
    language: 'German',
    tags: ['german', 'professional', 'precise', 'clear'],
  },
];

/**
 * ElevenLabs Voices
 * 10,000+ community voices, industry-leading quality
 * Note: These are popular pre-made voices. Users can also browse the full library.
 */
export const ELEVENLABS_VOICES: Voice[] = [
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam (Professional)',
    description: 'Deep and authoritative male voice, great for narration',
    gender: 'male',
    tags: ['professional', 'deep', 'authoritative', 'narration'],
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (Business)',
    description: 'Clear and professional female voice, perfect for business',
    gender: 'female',
    tags: ['professional', 'clear', 'business', 'corporate'],
  },
  {
    id: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura (Customer Service)',
    description: 'Warm and friendly, excellent for customer support',
    gender: 'female',
    tags: ['warm', 'friendly', 'customer-service', 'supportive'],
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni (Conversational)',
    description: 'Natural conversational style, engaging and relatable',
    gender: 'male',
    tags: ['conversational', 'natural', 'engaging', 'relatable'],
  },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold (News)',
    description: 'News anchor style, crisp and authoritative',
    gender: 'male',
    tags: ['news', 'crisp', 'authoritative', 'announcer'],
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily (Friendly)',
    description: 'Young and energetic, great for casual conversations',
    gender: 'female',
    tags: ['young', 'energetic', 'friendly', 'casual'],
  },
  {
    id: 'XB0fDUnXU5powFXDhCwa',
    name: 'Charlotte (British)',
    description: 'Sophisticated British accent, professional and polished',
    gender: 'female',
    accent: 'British',
    tags: ['british', 'sophisticated', 'professional', 'polished'],
  },
  {
    id: 'iP95p4xoKVk53GoZ742B',
    name: 'Chris (Sales)',
    description: 'Enthusiastic and persuasive, perfect for sales',
    gender: 'male',
    tags: ['sales', 'enthusiastic', 'persuasive', 'upbeat'],
  },
];

/**
 * All Voice Providers Configuration
 */
export const VOICE_PROVIDERS: VoiceProvider[] = [
  {
    id: 'cartesia',
    name: 'Cartesia',
    label: '⚡ Cartesia Sonic 2.0',
    description: 'Ultra-realistic voices with lightning-fast 90ms latency',
    latency: '90ms (40ms turbo)',
    languages: 15,
    voiceCount: '100+',
    costLevel: '$$',
    recommended: true,
    features: [
      'Lightning-fast 90ms latency',
      '100+ professional voices',
      '15 native languages',
      'Voice cloning (15s audio)',
      'Emotion & speed control',
      'HIPAA compliant',
    ],
    voices: CARTESIA_VOICES,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    label: '🎙️ ElevenLabs',
    description: 'Industry-leading quality, 10,000+ voices, 70+ languages',
    latency: '~300ms',
    languages: 70,
    voiceCount: '10,000+',
    costLevel: '$$$',
    features: [
      '10,000+ community voices',
      '70+ languages',
      'Used by 41% of Fortune 500',
      'Professional Voice Clones',
      'Advanced voice design',
      'Multi-language support',
    ],
    voices: ELEVENLABS_VOICES,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    label: '🤖 OpenAI TTS',
    description: 'Simple and reliable, 6 high-quality voices',
    latency: '~200ms',
    languages: 1,
    voiceCount: '6',
    costLevel: '$',
    features: [
      'Simple and reliable',
      '6 high-quality voices',
      'Easy to use',
      'Good for English',
      'Stable API',
      'Cost-effective',
    ],
    voices: OPENAI_VOICES,
  },
];

/**
 * Default voice provider and voice
 */
export const DEFAULT_VOICE_PROVIDER = 'cartesia';
export const DEFAULT_VOICE_ID = '79a125e8-cd45-4c13-8a67-188112f4dd22'; // Cartesia: American Business

/**
 * Helper functions
 */
export function getProviderById(providerId: string): VoiceProvider | undefined {
  return VOICE_PROVIDERS.find(p => p.id === providerId);
}

export function getVoiceById(providerId: string, voiceId: string): Voice | undefined {
  const provider = getProviderById(providerId);
  return provider?.voices.find(v => v.id === voiceId);
}

export function getVoicesByProvider(providerId: string): Voice[] {
  const provider = getProviderById(providerId);
  return provider?.voices || [];
}

export function filterVoices(voices: Voice[], filters: {
  gender?: string;
  language?: string;
  tags?: string[];
}): Voice[] {
  return voices.filter(voice => {
    if (filters.gender && voice.gender !== filters.gender) return false;
    if (filters.language && voice.language !== filters.language) return false;
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = filters.tags.some(tag => voice.tags?.includes(tag));
      if (!hasTag) return false;
    }
    return true;
  });
}
