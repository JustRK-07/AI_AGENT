/**
 * VoiceProviderSelector Component
 * Select TTS provider and voice with categorization and filtering
 */

import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, Search, Filter, Star, Globe, Zap, DollarSign } from 'lucide-react';
import {
  VOICE_PROVIDERS,
  getProviderById,
  getVoiceById,
  filterVoices,
  DEFAULT_VOICE_PROVIDER,
  DEFAULT_VOICE_ID,
  type Voice,
  type VoiceProvider,
} from '@/config/voice-providers';

interface VoiceProviderSelectorProps {
  selectedProvider: string;
  selectedVoice: string;
  onProviderChange: (providerId: string) => void;
  onVoiceChange: (voiceId: string) => void;
  onPreview?: (providerId: string, voiceId: string) => void;
  isPlaying?: string | null;
}

export function VoiceProviderSelector({
  selectedProvider,
  selectedVoice,
  onProviderChange,
  onVoiceChange,
  onPreview,
  isPlaying,
}: VoiceProviderSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const provider = getProviderById(selectedProvider);
  const selectedVoiceData = getVoiceById(selectedProvider, selectedVoice);

  // Filter voices based on search and filters
  const filteredVoices = useMemo(() => {
    if (!provider) return [];

    let voices = provider.voices;

    // Apply gender filter
    if (genderFilter !== 'all') {
      voices = filterVoices(voices, { gender: genderFilter });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      voices = voices.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query) ||
          v.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return voices;
  }, [provider, genderFilter, searchQuery]);

  const handleProviderChange = (providerId: string) => {
    onProviderChange(providerId);
    // Auto-select first voice or recommended voice
    const newProvider = getProviderById(providerId);
    if (newProvider && newProvider.voices.length > 0) {
      const recommendedVoice = newProvider.voices.find((v) => v.tags?.includes('professional'));
      onVoiceChange(recommendedVoice?.id || newProvider.voices[0].id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Voice Provider
        </Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{provider.label}</span>
                  {provider.recommended && (
                    <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                      Recommended
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Provider Info Card */}
        {provider && (
          <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                {provider.name}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {provider.costLevel}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              {provider.description}
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Zap className="h-3 w-3 text-yellow-600" />
                {provider.latency}
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Globe className="h-3 w-3 text-blue-600" />
                {provider.languages} langs
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Star className="h-3 w-3 text-purple-600" />
                {provider.voiceCount} voices
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice Selection Header with Search and Filters */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select Voice ({filteredVoices.length} available)
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-7 px-2 text-xs"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 w-16">Gender:</span>
              <div className="flex gap-1">
                {['all', 'male', 'female', 'neutral'].map((gender) => (
                  <Button
                    key={gender}
                    type="button"
                    variant={genderFilter === gender ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setGenderFilter(gender)}
                    className="h-7 px-3 text-xs capitalize"
                  >
                    {gender}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Voice Grid */}
        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-1">
          {filteredVoices.map((voice) => (
            <div
              key={voice.id}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selectedVoice === voice.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
              onClick={() => onVoiceChange(voice.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {voice.name}
                    </span>
                    {voice.gender && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {voice.gender}
                      </Badge>
                    )}
                    {voice.accent && (
                      <Badge variant="outline" className="text-xs">
                        {voice.accent}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {voice.description}
                  </p>
                  {voice.tags && voice.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {voice.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {onPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(selectedProvider, voice.id);
                    }}
                    className="ml-2 h-8 w-8 p-0"
                    title="Preview voice"
                  >
                    {isPlaying === voice.id ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredVoices.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No voices found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* Selected Voice Summary */}
      {selectedVoiceData && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-green-700 dark:text-green-300 font-medium">
                Selected Voice:
              </span>
              <div className="text-sm font-semibold text-green-900 dark:text-green-100 mt-0.5">
                {selectedVoiceData.name}
              </div>
            </div>
            {onPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPreview(selectedProvider, selectedVoice)}
                className="bg-white hover:bg-green-50 border-green-300"
              >
                {isPlaying === selectedVoice ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
