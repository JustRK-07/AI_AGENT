/**
 * InboundConfigSection Component
 * Configuration options specific to inbound call agents
 * Includes: Business hours, IVR, routing, transfers, fallbacks
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, Clock, Users, AlertCircle, ArrowRight, PhoneForwarded } from 'lucide-react';
import { BusinessHoursPicker } from '@/components/BusinessHoursPicker';
import type { BusinessHours } from '@/templates/types';

interface InboundConfigSectionProps {
  businessHours?: BusinessHours;
  transferNumber?: string;
  fallbackNumber?: string;
  outOfHoursMessage?: string;
  onBusinessHoursChange?: (hours: BusinessHours) => void;
  onTransferNumberChange?: (number: string) => void;
  onFallbackNumberChange?: (number: string) => void;
  onOutOfHoursMessageChange?: (message: string) => void;
}

export function InboundConfigSection({
  businessHours,
  transferNumber,
  fallbackNumber,
  outOfHoursMessage,
  onBusinessHoursChange,
  onTransferNumberChange,
  onFallbackNumberChange,
  onOutOfHoursMessageChange,
}: InboundConfigSectionProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Inbound Call Configuration
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Configure how your agent handles incoming calls
          </p>
        </div>
      </div>

      {/* Business Hours */}
      {onBusinessHoursChange && businessHours && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Business Hours
            </Label>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>
          <BusinessHoursPicker
            value={businessHours}
            onChange={onBusinessHoursChange}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Define when your agent is available. Calls outside business hours will receive the out-of-hours message.
          </p>
        </div>
      )}

      {/* Call Routing & Transfer */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <PhoneForwarded className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Smart Call Routing
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Route calls to human agents when needed for complex issues or customer requests
              </p>
            </div>
          </div>

          {/* Transfer Number */}
          {onTransferNumberChange && (
            <div className="mb-3">
              <Label htmlFor="transferNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Transfer Number (Human Escalation)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="transferNumber"
                  value={transferNumber || ''}
                  onChange={(e) => onTransferNumberChange(e.target.value)}
                  placeholder="+1234567890"
                  type="tel"
                  className="flex-1 bg-white dark:bg-gray-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Test number"
                >
                  Test
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1.5">
                <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Number to transfer calls when agent needs to escalate to a human representative</span>
              </p>
            </div>
          )}

          {/* Fallback Number */}
          {onFallbackNumberChange && (
            <div>
              <Label htmlFor="fallbackNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Fallback Number (Technical Issues)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="fallbackNumber"
                  value={fallbackNumber || ''}
                  onChange={(e) => onFallbackNumberChange(e.target.value)}
                  placeholder="+1234567890"
                  type="tel"
                  className="flex-1 bg-white dark:bg-gray-800"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Test number"
                >
                  Test
                </Button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>Backup number for calls when AI agent encounters technical failures</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Out of Hours Message */}
      {onOutOfHoursMessageChange && (
        <div>
          <Label htmlFor="outOfHoursMessage" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Out of Hours Message
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </Label>
          <Textarea
            id="outOfHoursMessage"
            value={outOfHoursMessage || ''}
            onChange={(e) => onOutOfHoursMessageChange(e.target.value)}
            placeholder="Thank you for calling. Our business hours are Monday to Friday, 9 AM to 5 PM. Please call back during business hours, or leave a message and we'll get back to you."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Message to play when customers call outside of business hours
          </p>
        </div>
      )}

      {/* Best Practices Card */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🎯 Inbound Best Practices
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <span><strong>Always provide a human escalation path</strong> - 41% of customers prefer human agents for complex issues</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <span><strong>Set clear business hours</strong> - Reduces customer frustration and improves satisfaction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <span><strong>Test your fallback numbers</strong> - Ensure backup numbers work before going live</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                  <span><strong>Keep out-of-hours messages concise</strong> - State hours clearly and offer alternatives</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
