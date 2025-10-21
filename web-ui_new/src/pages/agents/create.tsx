"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { agentsService, type CreateAgentData } from "@/services/agentsService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot,
  Zap,
  RefreshCw,
  MessageSquare,
  Mic,
  Rocket,
  ArrowLeft,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { withAuth } from "@/components/withAuth";
import {
  LLM_PROVIDERS,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_LLM_MODEL,
  getModelsForProvider,
  getModelByValue,
} from "@/config/llm-models";
import { DEFAULT_VOICE_PROVIDER, DEFAULT_VOICE_ID } from "@/config/voice-providers";
import { DEFAULT_STT_PROVIDER, DEFAULT_STT_MODEL } from "@/config/stt-providers";
import { AgentTemplateSelector } from "@/components/AgentTemplateSelector";
import { TokenLimitDisplay } from "@/components/TokenLimitDisplay";
import { VoiceProviderSelector } from "@/components/VoiceProviderSelector";
import { STTProviderSelector } from "@/components/STTProviderSelector";
import { InboundConfigSection } from "@/components/InboundConfigSection";
import { OutboundConfigSection, type OutboundConfig } from "@/components/OutboundConfigSection";
import type { AgentTemplate, BusinessHours } from "@/templates/types";
import { getDefaultBusinessHours } from "@/templates/types";
import { generatePythonScript } from "@/utils/pythonScriptGenerator";
import VoiceCallPopup from "@/components/landing/VoiceCallPopup";

interface AgentForm {
  name: string;
  description: string;
  systemPrompt: string;
  voiceId: string;
  personality: string;
  llmProvider: string;
  llmModel: string;
  callType?: 'inbound' | 'outbound';
  agentType?: string;
  businessHours?: BusinessHours;
  transferNumber?: string;
  fallbackNumber?: string;
  outOfHoursMessage?: string;
}

function CreateAgent() {
  const router = useRouter();

  // Template selector state
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // Voice call test state
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [voiceCallAgentId, setVoiceCallAgentId] = useState<string | null>(null);

  const [isCreatingAgent, setIsCreatingAgent] = useState(false);

  // Provider selections
  const [voiceProvider, setVoiceProvider] = useState(DEFAULT_VOICE_PROVIDER);
  const [sttProvider, setSTTProvider] = useState(DEFAULT_STT_PROVIDER);
  const [sttModel, setSTTModel] = useState(DEFAULT_STT_MODEL);
  const [outboundConfig, setOutboundConfig] = useState<OutboundConfig>({});

  // Form state
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: "",
    description: "",
    systemPrompt: "",
    voiceId: DEFAULT_VOICE_ID,
    personality: "",
    llmProvider: DEFAULT_LLM_PROVIDER,
    llmModel: DEFAULT_LLM_MODEL,
    callType: undefined,
  });

  // Voice preview state
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  // Get current selected model for token display
  const selectedModel = getModelByValue(agentForm.llmModel);

  // Template selection handler
  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentForm({
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      voiceId: template.recommendedVoice || DEFAULT_VOICE_ID,
      personality: template.recommendedPersonality || '',
      llmProvider: DEFAULT_LLM_PROVIDER,
      llmModel: template.recommendedModel || DEFAULT_LLM_MODEL,
      agentType: template.agentType,
      callType: template.agentType === 'inbound' ? 'inbound' : undefined,
      businessHours: template.metadata.businessHours || getDefaultBusinessHours(),
      transferNumber: template.metadata.transferConfig?.transferNumber || '',
      fallbackNumber: template.metadata.fallbackConfig?.fallbackNumber || '',
      outOfHoursMessage: template.metadata.outOfHoursMessage || '',
    });
  };

  // Voice preview handler (using browser TTS for demo)
  const handleVoicePreview = (providerId: string, voiceId: string) => {
    if (isPlayingVoice === voiceId) {
      window.speechSynthesis.cancel();
      setIsPlayingVoice(null);
      return;
    }

    window.speechSynthesis.cancel();
    setIsPlayingVoice(voiceId);

    const utterance = new SpeechSynthesisUtterance(
      "Hello, this is a preview of the selected voice. In production, this will use the actual voice provider API."
    );

    utterance.onend = () => {
      setIsPlayingVoice(null);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(null);
      toast.error("Voice preview not available in this browser");
    };

    window.speechSynthesis.speak(utterance);
  };

  // Agent creation handler
  const handleCreateAgent = async () => {
    if (!agentForm.name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    if (!agentForm.systemPrompt.trim()) {
      toast.error("Please enter a system prompt");
      return;
    }

    if (!agentForm.callType) {
      toast.error("Please select an agent type (Inbound or Outbound)");
      return;
    }

    setIsCreatingAgent(true);
    try {
      // Generate Python script to validate syntax
      toast.info("Validating Python script syntax...");
      const script = generatePythonScript(
        {
          id: 'temp-validation',
          name: agentForm.name,
          description: agentForm.description || '',
          systemPrompt: agentForm.systemPrompt || '',
          voiceId: agentForm.voiceId,
          llmModel: agentForm.llmModel,
        } as any,
        {
          model: agentForm.llmModel,
          voice: agentForm.voiceId,
          temperature: 0.7,
        }
      );

      // Validate the generated script
      const validationResult = await agentsService.validateScript(script, agentForm.name);

      if (!validationResult.valid) {
        setIsCreatingAgent(false);
        const errorMsg = validationResult.lineNumber
          ? `Python syntax error at line ${validationResult.lineNumber}: ${validationResult.error}`
          : `Python syntax error: ${validationResult.error}`;

        toast.error(errorMsg, {
          duration: 8000,
          description: validationResult.suggestion || 'Please fix the error and try again.',
        });
        return;
      }

      toast.success("Script syntax validated successfully!");

      // Build metadata object from form
      const metadata: any = {
        voiceProvider,
        sttProvider,
        sttModel,
      };

      if (agentForm.callType) {
        metadata.callType = agentForm.callType;
      }
      if (agentForm.agentType) {
        metadata.agentType = agentForm.agentType;
      }

      // Inbound-specific config
      if (agentForm.callType === 'inbound') {
        if (agentForm.businessHours) {
          metadata.businessHours = agentForm.businessHours;
        }
        if (agentForm.transferNumber) {
          metadata.transferConfig = { transferNumber: agentForm.transferNumber };
        }
        if (agentForm.fallbackNumber) {
          metadata.fallbackConfig = { fallbackNumber: agentForm.fallbackNumber };
        }
        if (agentForm.outOfHoursMessage) {
          metadata.outOfHoursMessage = agentForm.outOfHoursMessage;
        }
      }

      // Outbound-specific config
      if (agentForm.callType === 'outbound' && outboundConfig) {
        metadata.outboundConfig = outboundConfig;
      }

      const agentData: CreateAgentData = {
        name: agentForm.name,
        description: agentForm.description || undefined,
        systemPrompt: agentForm.systemPrompt || undefined,
        voiceId: agentForm.voiceId || undefined,
        personality: agentForm.personality || undefined,
        llmProvider: agentForm.llmProvider || undefined,
        llmModel: agentForm.llmModel || undefined,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };

      await agentsService.create(agentData);

      toast.success("Agent created and published!", {
        description: "Your agent is now live and ready to handle calls instantly - no deployment needed!"
      });

      // Navigate back to agents page
      router.push('/agents');

    } catch (error: any) {
      toast.error(`Failed to create agent: ${error.message}`);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  return (
    <>
      <Head>
        <title>Create Agent</title>
        <meta name="description" content="Create a new AI voice agent" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-[1600px] mx-auto px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/agents')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Agents
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Agent</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure your AI voice agent with real providers and instant publishing
                  </p>
                </div>
              </div>
              <AgentTemplateSelector
                onSelect={handleTemplateSelect}
                open={templateSelectorOpen}
                onOpenChange={setTemplateSelectorOpen}
              />
            </div>
            {selectedTemplate && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  ✅ Using <strong>{selectedTemplate.name}</strong> template - All fields pre-filled
                </p>
              </div>
            )}
          </div>

          {/* Instant Publishing Banner */}
          <div className="mb-6 px-6 py-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-semibold text-green-900">⚡ Instant Publishing Enabled</h4>
                <p className="text-sm text-green-700 mt-1">
                  Your agent goes live immediately when you click "Create & Publish" - Real voices from top providers, 99+ languages, with token limits displayed
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-3 border-b mb-4">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent Name *</Label>
                    <Input
                      id="name"
                      value={agentForm.name}
                      onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                      placeholder="e.g., Sales Assistant"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
                    <Input
                      id="description"
                      value={agentForm.description}
                      onChange={(e) => setAgentForm({...agentForm, description: e.target.value})}
                      placeholder="Brief purpose description"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="callType" className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent Type *</Label>
                    <Select
                      value={agentForm.callType || ''}
                      onValueChange={(value: 'inbound' | 'outbound') => setAgentForm({...agentForm, callType: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">
                          <div>
                            <div className="font-medium">📞 Inbound</div>
                            <div className="text-xs text-gray-500">Receive incoming calls, customer service</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="outbound">
                          <div>
                            <div className="font-medium">📱 Outbound</div>
                            <div className="text-xs text-gray-500">Make outgoing calls, sales, follow-ups</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      This determines which configuration options are available
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Voice Provider & STT */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-3 border-b mb-4">
                  <Mic className="h-5 w-5 text-purple-600" />
                  Voice & Speech Recognition
                </h3>

                {/* Voice Provider Selector */}
                <div className="mb-6">
                  <VoiceProviderSelector
                    selectedProvider={voiceProvider}
                    selectedVoice={agentForm.voiceId}
                    onProviderChange={setVoiceProvider}
                    onVoiceChange={(voiceId) => setAgentForm({...agentForm, voiceId})}
                    onPreview={handleVoicePreview}
                    isPlaying={isPlayingVoice}
                  />
                </div>

                {/* STT Provider Selector */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <STTProviderSelector
                    selectedProvider={sttProvider}
                    selectedModel={sttModel}
                    onProviderChange={setSTTProvider}
                    onModelChange={setSTTModel}
                  />
                </div>

                {/* Personality */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Label htmlFor="personality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent Personality</Label>
                  <Input
                    id="personality"
                    value={agentForm.personality}
                    onChange={(e) => setAgentForm({...agentForm, personality: e.target.value})}
                    placeholder="e.g., Friendly, professional, helpful"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Describe the tone and style of conversation
                  </p>
                </div>
              </div>

              {/* Section 3: LLM Model Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-3 border-b mb-4">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI Model Selection
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="llmProvider" className="text-sm font-medium text-gray-700 dark:text-gray-300">Provider</Label>
                      <Select
                        value={agentForm.llmProvider}
                        onValueChange={(value) => {
                          const provider = LLM_PROVIDERS.find(p => p.value === value);
                          const firstModel = provider?.models[0]?.value || DEFAULT_LLM_MODEL;
                          setAgentForm({
                            ...agentForm,
                            llmProvider: value,
                            llmModel: firstModel
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LLM_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.value} value={provider.value}>
                              {provider.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="llmModel" className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</Label>
                      <Select value={agentForm.llmModel} onValueChange={(value) => setAgentForm({...agentForm, llmModel: value})}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getModelsForProvider(agentForm.llmProvider).map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div className="flex items-center justify-between w-full">
                                <span>{model.label}</span>
                                {model.recommended && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700">
                                    ⭐
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Token Limit Display */}
                  {selectedModel && <TokenLimitDisplay model={selectedModel} />}
                </div>
              </div>

              {/* Section 4: Behavior & Instructions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-3 border-b mb-4">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Behavior & Instructions
                </h3>
                <div>
                  <Label htmlFor="systemPrompt" className="text-sm font-medium text-gray-700 dark:text-gray-300">System Prompt *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={agentForm.systemPrompt}
                    onChange={(e) => setAgentForm({...agentForm, systemPrompt: e.target.value})}
                    placeholder="Define how this agent should behave, respond, and interact with customers..."
                    rows={12}
                    className="resize-none mt-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Be specific about role, tone, typical scenarios, and expected behavior
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Dynamic Config Section Based on Call Type */}
              {agentForm.callType === 'inbound' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <InboundConfigSection
                    businessHours={agentForm.businessHours}
                    transferNumber={agentForm.transferNumber}
                    fallbackNumber={agentForm.fallbackNumber}
                    outOfHoursMessage={agentForm.outOfHoursMessage}
                    onBusinessHoursChange={(hours) => setAgentForm({ ...agentForm, businessHours: hours })}
                    onTransferNumberChange={(num) => setAgentForm({ ...agentForm, transferNumber: num })}
                    onFallbackNumberChange={(num) => setAgentForm({ ...agentForm, fallbackNumber: num })}
                    onOutOfHoursMessageChange={(msg) => setAgentForm({ ...agentForm, outOfHoursMessage: msg })}
                  />
                </div>
              )}

              {agentForm.callType === 'outbound' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                  <OutboundConfigSection onChange={setOutboundConfig} />
                </div>
              )}

              {!agentForm.callType && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📞</div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Select Agent Type First
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose <strong>Inbound</strong> or <strong>Outbound</strong> in the Basic Information section to see relevant configuration options here.
                    </p>
                    <div className="mt-4 space-y-2 text-left">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <strong>Inbound:</strong> Business hours, call routing, human escalation
                      </div>
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        <strong>Outbound:</strong> Dialer settings, campaigns, DNC compliance
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 5: Testing & Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 pb-3 border-b mb-4">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Testing & Preview
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-800 rounded-lg">
                      <Mic className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2">Talk in Real-Time</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                        Test your agent before going live. Have a conversation to verify behavior and responses.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!agentForm.name || !agentForm.systemPrompt) {
                            toast.error("Please fill in agent name and system prompt first", {
                              description: "These fields are required to test the agent"
                            });
                            return;
                          }
                          setVoiceCallAgentId('preview');
                          setVoiceCallOpen(true);
                        }}
                        className="w-full bg-white hover:bg-blue-50 border-blue-300"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Test Agent Before Publishing
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="mt-8 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 -mx-8 shadow-lg">
            <div className="max-w-[1600px] mx-auto flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/agents')}
                className="min-w-[120px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAgent}
                disabled={isCreatingAgent || !agentForm.name || !agentForm.systemPrompt || !agentForm.callType}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 min-w-[200px]"
              >
                {isCreatingAgent ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Create & Publish Instantly
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Call Test Popup */}
      <VoiceCallPopup
        isOpen={voiceCallOpen}
        onClose={() => {
          setVoiceCallOpen(false);
          setVoiceCallAgentId(null);
        }}
        agentId={voiceCallAgentId || undefined}
      />
    </>
  );
}

export default withAuth(CreateAgent);
