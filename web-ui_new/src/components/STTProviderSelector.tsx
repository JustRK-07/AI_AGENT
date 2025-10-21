/**
 * STTProviderSelector Component
 * Select Speech-to-Text provider and model with language support info
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, Zap, DollarSign, Search, CheckCircle, Info } from 'lucide-react';
import {
  STT_PROVIDERS,
  getSTTProviderById,
  getSTTModelById,
  DEFAULT_STT_PROVIDER,
  DEFAULT_STT_MODEL,
  type STTProvider,
  type STTModel,
} from '@/config/stt-providers';

interface STTProviderSelectorProps {
  selectedProvider: string;
  selectedModel: string;
  onProviderChange: (providerId: string) => void;
  onModelChange: (modelId: string) => void;
}

export function STTProviderSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}: STTProviderSelectorProps) {
  const [languageSearch, setLanguageSearch] = useState('');

  const provider = getSTTProviderById(selectedProvider);
  const model = getSTTModelById(selectedProvider, selectedModel);

  const handleProviderChange = (providerId: string) => {
    onProviderChange(providerId);
    // Auto-select recommended model
    const newProvider = getSTTProviderById(providerId);
    if (newProvider && newProvider.models.length > 0) {
      const recommendedModel = newProvider.models.find((m) => m.recommended);
      onModelChange(recommendedModel?.id || newProvider.models[0].id);
    }
  };

  // Filter languages based on search
  const filteredLanguages = model?.languages.filter((lang) =>
    lang.toLowerCase().includes(languageSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      {/* Provider Selection */}
      <div>
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Speech-to-Text Provider
        </Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STT_PROVIDERS.map((provider) => (
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
          <div className="mt-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
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
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
              {provider.description}
            </p>

            {/* Provider Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Zap className="h-3 w-3 text-yellow-600" />
                <span>{provider.avgLatency} latency</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Globe className="h-3 w-3 text-blue-600" />
                <span>{provider.languageSupport}+ languages</span>
              </div>
            </div>

            {/* Best For */}
            {provider.bestFor && provider.bestFor.length > 0 && (
              <div className="border-t border-purple-200 dark:border-purple-800 pt-2 mt-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="h-3 w-3 text-purple-600" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Best For:
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {provider.bestFor.map((useCase, index) => (
                    <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                      <span className="text-purple-600 dark:text-purple-400">•</span>
                      <span>{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Selection */}
      {provider && provider.models.length > 1 && (
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            STT Model
          </Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.recommended && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        ⭐
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Model Details */}
      {model && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {model.name}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {model.description}
              </p>
            </div>
            {model.recommended && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                Recommended
              </Badge>
            )}
          </div>

          {/* Model Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Languages</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {model.languageCount}+
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Latency</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {model.latency}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Accuracy</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {model.accuracy === 'excellent' ? (
                  <span className="text-green-600">⭐ Excellent</span>
                ) : model.accuracy === 'very-good' ? (
                  <span className="text-blue-600">Very Good</span>
                ) : (
                  <span className="text-gray-600">Good</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Support */}
      {model && model.languages.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Supported Languages ({filteredLanguages.length})
              </span>
            </div>
          </div>

          {/* Language Search */}
          <div className="mb-2">
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search languages..."
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                className="flex-1 h-7 text-sm border-0 p-0 focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Language List */}
          <div className="max-h-[200px] overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {filteredLanguages.slice(0, 20).map((language, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-700 dark:text-gray-300 py-1 px-2 bg-white dark:bg-gray-800 rounded flex items-center gap-1.5"
                >
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  <span className="truncate">{language}</span>
                </div>
              ))}
            </div>
            {filteredLanguages.length > 20 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                + {filteredLanguages.length - 20} more languages
              </div>
            )}
            {filteredLanguages.length === 0 && languageSearch && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                No languages found matching "{languageSearch}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          <strong>Tip:</strong> For multilingual customer service, AssemblyAI offers the best accuracy across 99+ languages.
          For English-only and speed-critical applications, Deepgram provides the fastest transcription.
        </div>
      </div>
    </div>
  );
}
