/**
 * TokenLimitDisplay Component
 * Displays token limits, context window, and cost information for LLM models
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Info, Zap, DollarSign, FileText } from 'lucide-react';
import type { LLMModel } from '@/config/llm-models';
import { formatTokenCount, tokensToWords, getCostLevelDescription } from '@/config/llm-models';

interface TokenLimitDisplayProps {
  model: LLMModel;
  compact?: boolean;
}

export function TokenLimitDisplay({ model, compact = false }: TokenLimitDisplayProps) {
  if (!model.contextWindow && !model.outputLimit && !model.costLevel) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
        {model.contextWindow && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {formatTokenCount(model.contextWindow)}
          </span>
        )}
        {model.costLevel && (
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {model.costLevel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="grid grid-cols-2 gap-3">
        {/* Context Window */}
        {model.contextWindow && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Context Window
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatTokenCount(model.contextWindow)} tokens
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tokensToWords(model.contextWindow)}
            </div>
          </div>
        )}

        {/* Output Limit */}
        {model.outputLimit && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Max Output
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatTokenCount(model.outputLimit)} tokens
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tokensToWords(model.outputLimit)}
            </div>
          </div>
        )}

        {/* Cost Level */}
        {model.costLevel && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Cost Level
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  model.costLevel === '$'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : model.costLevel === '$$'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : model.costLevel === '$$$'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {model.costLevel}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {getCostLevelDescription(model.costLevel)}
              </span>
            </div>
          </div>
        )}

        {/* Recommended Badge */}
        {model.recommended && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Info className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Status
              </span>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
              ⭐ Recommended
            </Badge>
          </div>
        )}
      </div>

      {/* Best For Section */}
      {model.bestFor && model.bestFor.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Best For:
            </span>
          </div>
          <ul className="space-y-1">
            {model.bestFor.map((useCase, index) => (
              <li key={index} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Token Comparison Component
 * Shows side-by-side comparison of multiple models
 */
interface TokenComparisonProps {
  models: LLMModel[];
}

export function TokenComparison({ models }: TokenComparisonProps) {
  if (models.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        Model Comparison
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((model) => (
          <div
            key={model.value}
            className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
              {model.label}
            </div>
            <div className="space-y-1 text-xs">
              {model.contextWindow && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Context:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTokenCount(model.contextWindow)}
                  </span>
                </div>
              )}
              {model.outputLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Output:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatTokenCount(model.outputLimit)}
                  </span>
                </div>
              )}
              {model.costLevel && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {model.costLevel}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
