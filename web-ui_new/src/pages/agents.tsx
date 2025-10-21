"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { agentsService, type Agent, type CreateAgentData } from "@/services/agentsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bot,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Square,
  Settings,
  Trash2,
  Edit,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
  Mic,
  BarChart3,
  TrendingUp,
  Users,
  FileCode,
  Rocket,
  History,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// NOTE: Deployment components removed - core-worker architecture
// import { LocalAgentStatus } from "@/components/LocalAgentStatus";
// import { DeploymentDialog } from "@/components/DeploymentDialog";
// import { CloudDeploymentDialog } from "@/components/CloudDeploymentDialog";
import { AgentScriptPreview } from "@/components/AgentScriptPreview";
import { TestAgentDialog } from "@/components/TestAgentDialog";
import { PromptHistoryDialog } from "@/components/PromptHistoryDialog";
import { withAuth } from "@/components/withAuth";
import { LLM_PROVIDERS, DEFAULT_LLM_PROVIDER, DEFAULT_LLM_MODEL, getModelsForProvider } from "@/config/llm-models";
import { AgentTemplateSelector } from "@/components/AgentTemplateSelector";
import { BusinessHoursPicker } from "@/components/BusinessHoursPicker";
import type { AgentTemplate, BusinessHours, TransferConfig, FallbackConfig } from "@/templates/types";
import { getDefaultBusinessHours } from "@/templates/types";
import { generatePythonScript } from "@/utils/pythonScriptGenerator";
import { SkeletonCard, SkeletonTable, SkeletonAgentBlock } from "@/components/skeletons";
import VoiceCallPopup from "@/components/landing/VoiceCallPopup";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";

interface AgentForm {
  name: string;
  description: string;
  systemPrompt: string;
  voiceId: string;
  personality: string;
  llmProvider: string;
  llmModel: string;
  // Template metadata fields
  callType?: 'inbound' | 'outbound';
  agentType?: string;
  businessHours?: BusinessHours;
  transferNumber?: string;
  fallbackNumber?: string;
  outOfHoursMessage?: string;
}

function Agents() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Script preview state
  const [scriptPreviewOpen, setScriptPreviewOpen] = useState(false);
  const [scriptPreviewAgent, setScriptPreviewAgent] = useState<Agent | null>(null);

  // NOTE: Deployment dialog state removed - core-worker architecture
  // const [deploymentDialogOpen, setDeploymentDialogOpen] = useState(false);
  // const [deploymentAgent, setDeploymentAgent] = useState<Agent | null>(null);
  // const [cloudDeploymentDialogOpen, setCloudDeploymentDialogOpen] = useState(false);
  // const [cloudDeploymentAgent, setCloudDeploymentAgent] = useState<Agent | null>(null);

  // Test agent dialog state
  const [testAgentDialogOpen, setTestAgentDialogOpen] = useState(false);
  const [testAgent, setTestAgent] = useState<Agent | null>(null);

  // Voice call test state
  const [voiceCallOpen, setVoiceCallOpen] = useState(false);
  const [voiceCallAgentId, setVoiceCallAgentId] = useState<string | null>(null);

  // Prompt history dialog state
  const [promptHistoryDialogOpen, setPromptHistoryDialogOpen] = useState(false);
  const [promptHistoryAgent, setPromptHistoryAgent] = useState<Agent | null>(null);

  // Template selector state
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  // Success dialog state
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [newlyCreatedAgent, setNewlyCreatedAgent] = useState<Agent | null>(null);

  const itemsPerPage = 10;

  // State for agent data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadStats, setLoadStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);

  // Form state
  const [agentForm, setAgentForm] = useState<AgentForm>({
    name: "",
    description: "",
    systemPrompt: "",
    voiceId: "nova",
    personality: "",
    llmProvider: DEFAULT_LLM_PROVIDER,
    llmModel: DEFAULT_LLM_MODEL,
    callType: undefined,
  });

  // Voice preview state
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  // Fetch agents from backend
  const fetchAgents = async () => {
    try {
      setIsLoading(true);

      // Add minimum loading delay for smooth UX
      const [response] = await Promise.all([
        agentsService.getAll({
          page: currentPage,
          limit: itemsPerPage,
          isActive: statusFilter === 'ALL' ? undefined : statusFilter,
        }),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);

      setAgents(response.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoadStats = async () => {
    try {
      const stats = await agentsService.getLoadStats();
      setLoadStats(stats);
    } catch (error) {
      console.error('Error fetching load stats:', error);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchAgents();
      fetchLoadStats();

      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchAgents();
          fetchLoadStats();
        }, 30000); // Changed from 5000ms (5s) to 30000ms (30s) to prevent rate limiting
        return () => clearInterval(interval);
      }
    }
  }, [currentPage, statusFilter, searchTerm, autoRefresh]);

  // Template selection handler
  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setAgentForm({
      name: template.name,
      description: template.description,
      systemPrompt: template.systemPrompt,
      voiceId: template.recommendedVoice || 'nova',
      personality: template.recommendedPersonality || '',
      llmProvider: DEFAULT_LLM_PROVIDER,
      llmModel: template.recommendedModel || DEFAULT_LLM_MODEL,
      agentType: template.agentType,
      businessHours: template.metadata.businessHours || getDefaultBusinessHours(),
      transferNumber: template.metadata.transferConfig?.transferNumber || '',
      fallbackNumber: template.metadata.fallbackConfig?.fallbackNumber || '',
      outOfHoursMessage: template.metadata.outOfHoursMessage || '',
    });
    setCreateDialogOpen(true);
  };

  // Agent operations
  const handleCreateAgent = async () => {
    if (!agentForm.name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    if (!agentForm.systemPrompt.trim()) {
      toast.error("Please enter a system prompt");
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

      // Proceed with agent creation
      // Build metadata object from form
      const metadata: any = {};
      if (agentForm.callType) {
        metadata.callType = agentForm.callType;
      }
      if (agentForm.agentType) {
        metadata.agentType = agentForm.agentType;
      }
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

      const createdAgent = await agentsService.create(agentData);

      toast.success("Agent created and published!", {
        description: "Your agent is now live and ready to handle calls instantly - no deployment needed!"
      });

      setCreateDialogOpen(false);
      setSelectedTemplate(null);
      setAgentForm({
        name: "",
        description: "",
        systemPrompt: "",
        voiceId: "nova",
        personality: "",
        llmProvider: DEFAULT_LLM_PROVIDER,
        llmModel: DEFAULT_LLM_MODEL,
        callType: undefined,
        agentType: undefined,
        businessHours: undefined,
        transferNumber: undefined,
        fallbackNumber: undefined,
        outOfHoursMessage: undefined,
      });

      // Fetch updated agents and show success dialog
      await fetchAgents();
      await fetchLoadStats();

      // Show success dialog with test options
      // Handle both response formats: { agent: Agent } or Agent directly
      const agent = (createdAgent as any)?.agent || createdAgent;
      setNewlyCreatedAgent(agent as Agent);
      setSuccessDialogOpen(true);
    } catch (error: any) {
      toast.error(`Failed to create agent: ${error.message}`);
    } finally {
      setIsCreatingAgent(false);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      try {
        await agentsService.delete(agentId);
        toast.success("Agent removed!", {
          description: "Agent deleted and no longer available for calls"
        });
        await fetchAgents();
        await fetchLoadStats();
      } catch (error: any) {
        toast.error(`Failed to delete agent: ${error.message}`);
      }
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      await agentsService.update(agent.id, {
        isActive: !agent.isActive
      });

      const isActivating = !agent.isActive;
      toast.success(
        isActivating
          ? `${agent.name} is now LIVE!`
          : `${agent.name} is now inactive`,
        {
          description: isActivating
            ? "Agent published instantly and ready to handle calls"
            : "Agent will not receive new calls"
        }
      );

      await fetchAgents();
      await fetchLoadStats();
    } catch (error: any) {
      toast.error(`Failed to update agent: ${error.message}`);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description || "",
      systemPrompt: agent.systemPrompt || "",
      voiceId: agent.voiceId || "nova",
      personality: agent.personality || "",
      llmProvider: agent.llmProvider || DEFAULT_LLM_PROVIDER,
      llmModel: agent.llmModel || DEFAULT_LLM_MODEL,
    });
    setEditDialogOpen(true);
  };

  // NOTE: PM2 deployment handlers removed - core-worker architecture
  // const handleRunLocally = async (agent: Agent) => { ... }
  // const handleStopLocal = async (agent: Agent) => { ... }

  const handleUpdateAgent = async () => {
    if (!selectedAgent || !agentForm.name.trim()) {
      toast.error("Please enter an agent name");
      return;
    }

    setIsUpdatingAgent(true);
    try {
      await agentsService.update(selectedAgent.id, {
        name: agentForm.name,
        description: agentForm.description || undefined,
        systemPrompt: agentForm.systemPrompt || undefined,
        voiceId: agentForm.voiceId || undefined,
        personality: agentForm.personality || undefined,
        llmProvider: agentForm.llmProvider || undefined,
        llmModel: agentForm.llmModel || undefined,
      });
      setEditDialogOpen(false);
      setSelectedAgent(null);
      setAgentForm({
        name: "",
        description: "",
        systemPrompt: "",
        voiceId: "nova",
        personality: "",
        llmProvider: DEFAULT_LLM_PROVIDER,
        llmModel: DEFAULT_LLM_MODEL,
      });
      await fetchAgents();
      await fetchLoadStats();
      toast.success("Agent updated and live!", {
        description: "Changes applied instantly to all new calls"
      });
    } catch (error: any) {
      toast.error(`Failed to update agent: ${error.message}`);
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  // Voice preview handler
  const handleVoicePreview = (voiceId: string) => {
    if (isPlayingVoice === voiceId) {
      // Stop current preview
      window.speechSynthesis.cancel();
      setIsPlayingVoice(null);
      return;
    }

    // Stop any currently playing
    window.speechSynthesis.cancel();
    setIsPlayingVoice(voiceId);

    // Create utterance
    const voiceDescriptions: Record<string, string> = {
      nova: "Hello, I'm Nova. I have a warm and professional voice.",
      alloy: "Hi there, I'm Alloy. My voice is neutral and clear.",
      echo: "Greetings, I'm Echo. I sound confident and strong.",
      fable: "Hello friend, I'm Fable. My voice is engaging for storytelling.",
      onyx: "Good day, I'm Onyx. I have a deep and authoritative tone.",
      shimmer: "Hey! I'm Shimmer. I'm friendly and energetic!"
    };

    const utterance = new SpeechSynthesisUtterance(voiceDescriptions[voiceId] || "Hello, this is a voice preview.");

    utterance.onend = () => {
      setIsPlayingVoice(null);
    };

    utterance.onerror = () => {
      setIsPlayingVoice(null);
      toast.error("Voice preview not available in this browser");
    };

    window.speechSynthesis.speak(utterance);
  };




  // Stats calculations (based on isActive and loadStats)
  const totalAgents = agents?.length || 0;
  const activeAgents = agents?.filter(a => a.isActive).length || 0;
  const inactiveAgents = agents?.filter(a => !a.isActive).length || 0;
  const busyAgents = loadStats?.data?.filter((a: any) => a.activeCalls > 0).length || 0;
  const availableAgents = loadStats?.data?.filter((a: any) => a.available).length || 0;

  // Filter agents
  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" ? true :
      statusFilter === "true" ? agent.isActive :
      statusFilter === "false" ? !agent.isActive :
      true;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil((filteredAgents?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgents = filteredAgents?.slice(startIndex, endIndex);

  return (
    <>
      <Head>
        <title>Agents</title>
        <meta name="description" content="AI Agent Management" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-[1600px] mx-auto px-8 py-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsSyncing(true);
                  await fetchAgents();
                  setIsSyncing(false);
                  toast.success("Agents refreshed", {
                    description: "All agents up-to-date"
                  });
                }}
                title="Refresh agent list - Changes are instant, no sync needed"
                disabled={isSyncing}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  isSyncing && "animate-spin"
                )} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => router.push('/agents/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
          </div>
        </div>

        {/* NOTE: Local Running Agents section removed - core-worker architecture */}

        {/* Instant Publishing Info Card */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-green-100 rounded-lg">
                <Rocket className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-1">⚡ Instant Publishing Enabled</h3>
                <p className="text-sm text-green-700 mb-2">
                  All agent changes go live immediately - no deployment needed, no waiting. Create, update, or deactivate agents and see changes instantly.
                </p>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-900">Create in Seconds</p>
                      <p className="text-xs text-green-700">Agent live instantly</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-900">Update Anytime</p>
                      <p className="text-xs text-green-700">Changes apply to new calls</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-green-900">Toggle On/Off</p>
                      <p className="text-xs text-green-700">Activate or pause instantly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Section */}
        <CollapsibleCard
          title="All Agents"
          subtitle="Configure and manage your AI agents"
          icon={<Bot className="h-5 w-5" />}
          storageKey="agents-table"
          defaultCollapsed={false}
          collapsible={true}
          closeable={false}
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-0">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} columns={7} />
              </div>
            ) : filteredAgents?.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No agents found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first agent to get started</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Voice ID</TableHead>
                      <TableHead>Max Concurrent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Campaigns</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAgents?.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                            <span>{agent.name}</span>
                            {agent.isActive && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs px-1.5 py-0">
                                <Zap className="h-2.5 w-2.5 mr-0.5" />
                                LIVE
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {agent.description || "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mic className="h-3 w-3 text-gray-400 dark:text-gray-600" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{agent.voiceId || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs w-fit">
                            {agent.maxConcurrentCalls}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => handleToggleActive(agent)}>
                            <StatusBadge
                              status={agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                              type={agent.isActive ? 'success' : 'default'}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400 dark:text-gray-600" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{agent._count?.campaignAgents || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setTestAgent(agent);
                                setTestAgentDialogOpen(true);
                              }}>
                                <Phone className="h-4 w-4 mr-2 text-green-600" />
                                Test Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setVoiceCallAgentId(agent.id);
                                setVoiceCallOpen(true);
                              }}>
                                <Mic className="h-4 w-4 mr-2 text-purple-600" />
                                Test with Voice Call
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* NOTE: Deployment menu items removed - core-worker architecture */}
                              <DropdownMenuItem onClick={() => {
                                setScriptPreviewAgent(agent);
                                setScriptPreviewOpen(true);
                              }}>
                                <FileCode className="h-4 w-4 mr-2" />
                                Preview Python Script
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAgent(agent)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Agent
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setPromptHistoryAgent(agent);
                                setPromptHistoryDialogOpen(true);
                              }}>
                                <History className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteAgent(agent.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAgents?.length || 0)} of {filteredAgents?.length || 0} results
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleCard>

        {/* Edit Agent Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[80vw] max-w-none max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update your AI agent configuration
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700">Agent Name *</Label>
                <Input
                  id="edit-name"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                  placeholder="Enter a name for your agent"
                  className="h-11"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">Description</Label>
                <Input
                  id="edit-description"
                  value={agentForm.description}
                  onChange={(e) => setAgentForm({...agentForm, description: e.target.value})}
                  placeholder="Brief description of this agent's purpose"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="edit-voiceId" className="text-sm font-semibold text-gray-700">Voice ID</Label>
                  <div className="flex gap-2">
                    <Select value={agentForm.voiceId} onValueChange={(value) => setAgentForm({...agentForm, voiceId: value})}>
                      <SelectTrigger className="h-11 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nova">🎙️ Nova (Warm & Professional)</SelectItem>
                        <SelectItem value="alloy">🎵 Alloy (Neutral & Clear)</SelectItem>
                        <SelectItem value="echo">🔊 Echo (Confident & Strong)</SelectItem>
                        <SelectItem value="fable">📚 Fable (Storytelling & Engaging)</SelectItem>
                        <SelectItem value="onyx">💼 Onyx (Deep & Authoritative)</SelectItem>
                        <SelectItem value="shimmer">✨ Shimmer (Friendly & Energetic)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVoicePreview(agentForm.voiceId)}
                      className="h-11 px-3"
                      title="Preview voice"
                    >
                      {isPlayingVoice === agentForm.voiceId ? (
                        <Square className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="edit-personality" className="text-sm font-semibold text-gray-700">Personality</Label>
                  <Input
                    id="edit-personality"
                    value={agentForm.personality}
                    onChange={(e) => setAgentForm({...agentForm, personality: e.target.value})}
                    placeholder="e.g., Friendly and professional"
                    className="h-11"
                  />
                </div>
              </div>

              {/* LLM Model Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="edit-llmProvider" className="text-sm font-semibold text-gray-700">LLM Provider</Label>
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
                    <SelectTrigger className="h-11">
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
                <div className="space-y-3">
                  <Label htmlFor="edit-llmModel" className="text-sm font-semibold text-gray-700">LLM Model</Label>
                  <Select value={agentForm.llmModel} onValueChange={(value) => setAgentForm({...agentForm, llmModel: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getModelsForProvider(agentForm.llmProvider).map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                          {model.description && (
                            <span className="text-xs text-gray-500"> - {model.description}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-systemPrompt" className="text-sm font-semibold text-gray-700">System Prompt *</Label>
                <Textarea
                  id="edit-systemPrompt"
                  value={agentForm.systemPrompt}
                  onChange={(e) => setAgentForm({...agentForm, systemPrompt: e.target.value})}
                  placeholder="Enter the system prompt that defines how this agent should behave..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAgent}
                  disabled={isUpdatingAgent || !agentForm.name || !agentForm.systemPrompt}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isUpdatingAgent ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Agent
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Python Script Preview Modal */}
      {scriptPreviewAgent && (
        <AgentScriptPreview
          agent={scriptPreviewAgent}
          isOpen={scriptPreviewOpen}
          onClose={() => {
            setScriptPreviewOpen(false);
            setScriptPreviewAgent(null);
          }}
          model={scriptPreviewAgent.llmModel || 'gpt-4o-mini'}
          voice={scriptPreviewAgent.voiceId || 'alloy'}
          temperature={0.7}
        />
      )}

      {/* NOTE: Deployment dialogs removed - core-worker architecture */}

      {/* Test Agent Dialog */}
      <TestAgentDialog
        agent={testAgent}
        isOpen={testAgentDialogOpen}
        onClose={() => {
          setTestAgentDialogOpen(false);
          setTestAgent(null);
        }}
      />

      {/* Voice Call Test Popup */}
      <VoiceCallPopup
        isOpen={voiceCallOpen}
        onClose={() => {
          setVoiceCallOpen(false);
          setVoiceCallAgentId(null);
        }}
        agentId={voiceCallAgentId || undefined}
      />

      {/* Prompt History Dialog */}
      <PromptHistoryDialog
        agent={promptHistoryAgent}
        isOpen={promptHistoryDialogOpen}
        onClose={() => {
          setPromptHistoryDialogOpen(false);
          setPromptHistoryAgent(null);
        }}
      />

      {/* Success Dialog - Agent Created */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">Agent Created & Live!</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  {newlyCreatedAgent?.name} is now active and ready to handle calls
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Published Instantly</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Your agent is live right now. No deployment wait, no complex setup required.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">What would you like to do?</p>

              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  if (newlyCreatedAgent?.id) {
                    setVoiceCallAgentId(newlyCreatedAgent.id);
                    setVoiceCallOpen(true);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Mic className="h-4 w-4 mr-2" />
                Test Agent Now
              </Button>

              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  if (newlyCreatedAgent?.id) {
                    router.push(`/agents/${newlyCreatedAgent.id}`);
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                View Agent Details
              </Button>

              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  setCreateDialogOpen(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Another Agent
              </Button>

              <Button
                onClick={() => {
                  setSuccessDialogOpen(false);
                  setNewlyCreatedAgent(null);
                }}
                variant="ghost"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}

export default withAuth(Agents);