/**
 * OutboundConfigSection Component
 * Configuration options specific to outbound call agents
 * Includes: Dialer settings, campaign config, CRM integration, compliance
 */

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PhoneOutgoing, Target, Database, Shield, Calendar, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OutboundConfigSectionProps {
  onChange?: (config: OutboundConfig) => void;
}

export interface OutboundConfig {
  // Dialer Settings
  dialerType?: 'auto' | 'predictive' | 'progressive';
  callPacing?: number; // calls per hour
  retryAttempts?: number;
  retryDelay?: number; // minutes

  // Campaign Settings
  campaignObjective?: 'lead-gen' | 'sales' | 'follow-up' | 'survey';
  targetDemographics?: string;
  callWindows?: string; // "9am-5pm EST"

  // Compliance
  dncListEnabled?: boolean;
  consentTracking?: boolean;
  recordingDisclosure?: boolean;
}

export function OutboundConfigSection({ onChange }: OutboundConfigSectionProps) {
  const [config, setConfig] = useState<OutboundConfig>({
    dialerType: 'auto',
    callPacing: 30,
    retryAttempts: 3,
    retryDelay: 30,
    campaignObjective: 'lead-gen',
    dncListEnabled: true,
    consentTracking: true,
    recordingDisclosure: true,
  });

  const updateConfig = (updates: Partial<OutboundConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange?.(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <PhoneOutgoing className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Outbound Call Configuration
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Configure how your agent makes outgoing calls
          </p>
        </div>
      </div>

      {/* Dialer Settings */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <PhoneOutgoing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Dialer Configuration
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Control how the system dials contacts and manages call attempts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dialer Type */}
            <div>
              <Label htmlFor="dialerType" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Dialer Type
              </Label>
              <Select
                value={config.dialerType}
                onValueChange={(value: 'auto' | 'predictive' | 'progressive') =>
                  updateConfig({ dialerType: value })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div>
                      <div className="font-medium">Auto Dialer</div>
                      <div className="text-xs text-gray-500">Dials one contact at a time</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="predictive">
                    <div>
                      <div className="font-medium">Predictive Dialer</div>
                      <div className="text-xs text-gray-500">AI predicts agent availability</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="progressive">
                    <div>
                      <div className="font-medium">Progressive Dialer</div>
                      <div className="text-xs text-gray-500">Dials when agent is ready</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Call Pacing */}
            <div>
              <Label htmlFor="callPacing" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Call Pacing (calls/hour)
              </Label>
              <Input
                id="callPacing"
                type="number"
                value={config.callPacing}
                onChange={(e) => updateConfig({ callPacing: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Retry Attempts */}
            <div>
              <Label htmlFor="retryAttempts" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Retry Attempts
              </Label>
              <Input
                id="retryAttempts"
                type="number"
                value={config.retryAttempts}
                onChange={(e) => updateConfig({ retryAttempts: parseInt(e.target.value) })}
                min="0"
                max="10"
                className="bg-white dark:bg-gray-800"
              />
            </div>

            {/* Retry Delay */}
            <div>
              <Label htmlFor="retryDelay" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Retry Delay (minutes)
              </Label>
              <Input
                id="retryDelay"
                type="number"
                value={config.retryDelay}
                onChange={(e) => updateConfig({ retryDelay: parseInt(e.target.value) })}
                min="5"
                max="1440"
                className="bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Settings */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Campaign Strategy
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Define your campaign objectives and target audience
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Campaign Objective */}
            <div>
              <Label htmlFor="campaignObjective" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Campaign Objective
              </Label>
              <Select
                value={config.campaignObjective}
                onValueChange={(value: 'lead-gen' | 'sales' | 'follow-up' | 'survey') =>
                  updateConfig({ campaignObjective: value })
                }
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead-gen">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Lead Generation
                    </div>
                  </SelectItem>
                  <SelectItem value="sales">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Sales / Conversion
                    </div>
                  </SelectItem>
                  <SelectItem value="follow-up">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Follow-up / Nurture
                    </div>
                  </SelectItem>
                  <SelectItem value="survey">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Survey / Feedback
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Demographics */}
            <div>
              <Label htmlFor="targetDemographics" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Target Demographics
                <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
              </Label>
              <Textarea
                id="targetDemographics"
                value={config.targetDemographics || ''}
                onChange={(e) => updateConfig({ targetDemographics: e.target.value })}
                placeholder="E.g., Small business owners, 30-50 years old, interested in SaaS solutions"
                rows={2}
                className="resize-none bg-white dark:bg-gray-800"
              />
            </div>

            {/* Call Windows */}
            <div>
              <Label htmlFor="callWindows" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Optimal Call Windows
                <Badge variant="outline" className="ml-2 text-xs">Optional</Badge>
              </Label>
              <Input
                id="callWindows"
                value={config.callWindows || ''}
                onChange={(e) => updateConfig({ callWindows: e.target.value })}
                placeholder="e.g., 9am-5pm EST, Weekdays only"
                className="bg-white dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Best times to reach your target audience
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Ethics */}
      <Card className="border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Compliance & Legal Requirements
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                Required settings to comply with telemarketing regulations
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* DNC List */}
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dncList"
                  checked={config.dncListEnabled}
                  onChange={(e) => updateConfig({ dncListEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="dncList" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex items-center gap-2">
                  Do Not Call (DNC) List Integration
                  {config.dncListEnabled && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Automatically filter out numbers on DNC registry (Required by law)
                </p>
              </div>
            </div>

            {/* Consent Tracking */}
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="consentTracking"
                  checked={config.consentTracking}
                  onChange={(e) => updateConfig({ consentTracking: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="consentTracking" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex items-center gap-2">
                  Consent Tracking
                  {config.consentTracking && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Log and verify customer consent for calls and data usage
                </p>
              </div>
            </div>

            {/* Recording Disclosure */}
            <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recordingDisclosure"
                  checked={config.recordingDisclosure}
                  onChange={(e) => updateConfig({ recordingDisclosure: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="recordingDisclosure" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer flex items-center gap-2">
                  Call Recording Disclosure
                  {config.recordingDisclosure && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Notify customers that calls may be recorded (Required in many states)
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Warning */}
          <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Legal Notice:</strong> Ensure compliance with TCPA, TSR, and state-specific regulations.
              Violations can result in fines up to $43,792 per call. Consult with legal counsel before launching
              outbound campaigns.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                🎯 Outbound Best Practices
              </h4>
              <ul className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Respect DNC lists</strong> - Non-negotiable for legal compliance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Call during appropriate hours</strong> - 8am-9pm in recipient's timezone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Provide opt-out mechanism</strong> - Allow contacts to request removal</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                  <span><strong>Monitor call quality</strong> - Review recordings regularly for improvement</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
