"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { campaignsService, Campaign, CreateCampaignData } from "@/services/campaignsService";
import { phoneNumbersService, PhoneNumber } from "@/services/phoneNumbersService";
import { agentsService, Agent } from "@/services/agentsService";
import { leadsService } from "@/services/leadsService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  BarChart3,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Phone,
  TrendingUp,
  RefreshCw,
  Edit,
  Trash2,
  Link,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Bot,
  PhoneIncoming,
  PhoneOutgoing,
  Wifi,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { withAuth } from "@/components/withAuth";
import { SkeletonCard, SkeletonTable } from "@/components/skeletons";

// Using Campaign type from campaignsService

function Campaigns() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDescription, setNewCampaignDescription] = useState("");
  const [campaignType, setCampaignType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedPhoneNumbers, setSelectedPhoneNumbers] = useState<string[]>([]);
  const [selectedSipTrunk, setSelectedSipTrunk] = useState("");
  const [leadListFile, setLeadListFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Real API data
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch campaigns from real API
  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      // Add minimum loading delay for smooth UX
      const [response] = await Promise.all([
        campaignsService.getAll(),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setCampaigns(response.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch phone numbers from real API
  const fetchPhoneNumbers = async () => {
    try {
      const response = await phoneNumbersService.getAll();
      setPhoneNumbers(response.data || []);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
    }
  };

  // Fetch agents from real API
  const fetchAgents = async () => {
    try {
      // Fetch only active/running agents that are sending heartbeats
      const response = await agentsService.getActive();
      setAgents(response.agents || []);
    } catch (error) {
      console.error('Error fetching active agents:', error);
      // Fallback to empty array if no active agents
      setAgents([]);
    }
  };

  useEffect(() => {
    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchCampaigns();
      fetchPhoneNumbers();
      fetchAgents();
    }
  }, []);

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    // Validate INBOUND campaign requirements
    if (campaignType === 'INBOUND') {
      if (!selectedAgent) {
        toast.error("Please select an agent for inbound campaign");
        return;
      }
      if (selectedPhoneNumbers.length === 0) {
        toast.error("Please select at least one phone number for inbound campaign");
        return;
      }
    }

    setIsCreating(true);
    try {
      // Get the selected agent's livekitAgentName
      const selectedAgentData = agents.find(a => a.id === selectedAgent);
      const agentName = selectedAgentData?.livekitAgentName || selectedAgentData?.name;

      // Map selected phone number IDs to actual phone numbers
      const selectedPhoneNumberStrings = phoneNumbers
        .filter(p => selectedPhoneNumbers.includes(p.id))
        .map(p => p.number);

      const campaignData: CreateCampaignData = {
        name: newCampaignName,
        description: newCampaignDescription,
        campaignType: campaignType,  // Include campaign type
        agentName: agentName || undefined,  // Include agent name
        phoneNumbers: selectedPhoneNumberStrings.length > 0 ? selectedPhoneNumberStrings : undefined,  // Include phone numbers
        maxConcurrent: 3,
        callDelay: 2000,
        sipTrunkId: selectedSipTrunk || undefined,
      };

      const createdCampaign = await campaignsService.create(campaignData);

      // Upload leads if CSV file provided
      if (leadListFile && createdCampaign) {
        try {
          toast.info("Uploading lead list...");
          const uploadResult = await leadsService.uploadCSV(createdCampaign.id, leadListFile);
          toast.success(`${campaignType} campaign created with ${uploadResult.imported} leads!`);
        } catch (uploadError: any) {
          toast.warning(`Campaign created but lead upload failed: ${uploadError.message}`);
        }
      } else {
        toast.success(`${campaignType} campaign created successfully!`);
      }

      // Reset form
      setNewCampaignName("");
      setNewCampaignDescription("");
      setCampaignType('INBOUND');
      setSelectedAgent("");
      setSelectedPhoneNumbers([]);
      setSelectedSipTrunk("");
      setLeadListFile(null);
      setCreateDialogOpen(false);

      // Refresh campaigns
      await fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (campaignId: string, newStatus: string) => {
    try {
      // Use dedicated campaign control endpoints
      if (newStatus === 'ACTIVE') {
        await campaignsService.start(campaignId);
        toast.success("Campaign activated!");
      } else if (newStatus === 'PAUSED') {
        await campaignsService.pause(campaignId);
        toast.success("Campaign paused!");
      } else if (newStatus === 'STOPPED') {
        await campaignsService.stop(campaignId);
        toast.success("Campaign stopped!");
      } else {
        await campaignsService.update(campaignId, { status: newStatus });
        toast.success("Campaign status updated!");
      }
      await fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to update campaign");
    }
  };

  const handleRestartCampaign = async (campaignId: string) => {
    try {
      toast.info("Restarting campaign...");
      const result = await campaignsService.restart(campaignId);
      toast.success(`Campaign restarted! ${result.totalLeads} leads reset and calling started.`);
      await fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to restart campaign");
    }
  };

  const viewTrunkDetails = (campaign: Campaign) => {
    const trunk = campaign.livekitTrunk;
    if (!trunk) {
      alert('No LiveKit trunk associated with this campaign');
      return;
    }

    const details = `
LiveKit Trunk Details:
- Name: ${trunk.name || 'N/A'}
- Type: ${trunk.trunkType || campaign.campaignType}
- Status: ${trunk.status}
- Trunk ID: ${trunk.livekitTrunkId || 'Not provisioned'}
- Max Concurrent Calls: ${trunk.maxConcurrentCalls || 10}
${campaign.campaignAgents?.length ? `\n- Agents: ${campaign.campaignAgents.length} assigned` : ''}
${campaign.phoneNumbers?.length ? `\n- Phone Numbers: ${campaign.phoneNumbers.length} assigned` : ''}
    `;

    alert(details);
  };

  const handleViewDetails = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete the campaign "${campaignName}"?`)) {
      return;
    }

    try {
      await campaignsService.delete(campaignId);
      toast.success(`Campaign "${campaignName}" deleted successfully!`);
      await fetchCampaigns();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete campaign");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "PAUSED": return "secondary";
      case "COMPLETED": return "outline";
      case "DRAFT": return "secondary";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Play className="h-3 w-3" />;
      case "PAUSED": return <Pause className="h-3 w-3" />;
      case "COMPLETED": return <CheckCircle className="h-3 w-3" />;
      case "DRAFT": return <FileText className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Stats calculations
  const totalCampaigns = campaigns?.length || 0;
  const activeCampaigns = campaigns?.filter(c => c.status === "ACTIVE").length || 0;
  const inboundCampaigns = campaigns?.filter(c => c.campaignType === "INBOUND").length || 0;
  const outboundCampaigns = campaigns?.filter(c => c.campaignType === "OUTBOUND").length || 0;
  const trunksActive = campaigns?.filter(c => c.livekitTrunk?.status === "ACTIVE").length || 0;
  const trunksProvisioning = campaigns?.filter(c => c.livekitTrunk?.status === "PROVISIONING").length || 0;

  // Filter campaigns
  const filteredCampaigns = campaigns?.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ||
                         (statusFilter === "ACTIVE" && campaign.status === "ACTIVE") ||
                         (statusFilter === "INACTIVE" && campaign.status !== "ACTIVE");
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil((filteredCampaigns?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCampaigns = filteredCampaigns?.slice(startIndex, endIndex);

  return (
    <>
      <Head>
        <title>Campaigns</title>
        <meta name="description" content="Campaign Management" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-[1600px] mx-auto px-8 py-4 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campaigns</h1>
                </div>
              </div>
            </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaigns()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Campaign</DialogTitle>
                  <DialogDescription>
                    Set up a new campaign and assign lead lists for automated outreach
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Campaign Name</Label>
                      <Input
                        placeholder="Enter campaign name"
                        value={newCampaignName}
                        onChange={(e) => setNewCampaignName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Campaign Type</Label>
                      <Select value={campaignType} onValueChange={(value: 'INBOUND' | 'OUTBOUND') => {
                        setCampaignType(value);
                        // Clear lead file when switching to INBOUND
                        if (value === 'INBOUND') {
                          setLeadListFile(null);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INBOUND">
                            <div className="flex items-center gap-2">
                              <PhoneIncoming className="h-4 w-4" />
                              <span>Inbound</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="OUTBOUND">
                            <div className="flex items-center gap-2">
                              <PhoneOutgoing className="h-4 w-4" />
                              <span>Outbound</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Description (Optional)</Label>
                    <Textarea
                      placeholder="Enter campaign description"
                      value={newCampaignDescription}
                      onChange={(e) => setNewCampaignDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Assign AI Agent (Optional)</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an active agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents && agents.length > 0 ? (
                          agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_none" disabled>
                            No active agents available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">Agent will be assigned to handle calls</p>
                  </div>

                  <div>
                    <Label>Assign Phone Numbers {campaignType === 'INBOUND' ? '(Required)' : '(Optional)'}</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3 mt-2">
                      {(() => {
                        // Filter phone numbers based on campaign type
                        const availableNumbers = phoneNumbers?.filter(phone => {
                          if (!phone.isActive) return false;

                          // For INBOUND: show numbers not assigned to any INBOUND campaign
                          if (campaignType === 'INBOUND') {
                            return !(phone as any).inboundCampaign;
                          }
                          // For OUTBOUND: show numbers not assigned to any OUTBOUND campaign
                          else {
                            return !(phone as any).outboundCampaign;
                          }
                        }) || [];

                        return availableNumbers.length > 0 ? (
                          availableNumbers.map((phone) => (
                            <div key={phone.id} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={phone.id}
                                checked={selectedPhoneNumbers.includes(phone.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPhoneNumbers([...selectedPhoneNumbers, phone.id]);
                                  } else {
                                    setSelectedPhoneNumbers(selectedPhoneNumbers.filter(id => id !== phone.id));
                                  }
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={phone.id} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900">{phone.number}</span>
                                  <Badge variant="outline" className="text-xs">Active</Badge>
                                </div>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500">No available phone numbers for {campaignType} campaigns</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {campaignType === 'INBOUND'
                                ? 'All numbers are assigned to other inbound campaigns'
                                : 'All numbers are assigned to other outbound campaigns'}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {campaignType === 'INBOUND'
                        ? 'Select phone numbers to receive calls. Numbers can be used for one inbound AND one outbound campaign.'
                        : 'Select phone numbers for outbound calling. Numbers can be used for one inbound AND one outbound campaign.'}
                    </p>
                  </div>

                  {campaignType === 'OUTBOUND' && (
                    <div>
                      <Label>Upload Lead List (Optional)</Label>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.name.endsWith('.csv')) {
                                toast.error('Please upload a CSV file');
                                e.target.value = '';
                                return;
                              }
                              setLeadListFile(file);
                              toast.success(`Selected: ${file.name}`);
                            }
                          }}
                          className="cursor-pointer"
                        />
                        {leadListFile && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ {leadListFile.name} ({(leadListFile.size / 1024).toFixed(1)} KB)
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Upload a CSV file with columns: phoneNumber, name (optional), email (optional)
                      </p>
                    </div>
                  )}

                  {campaignType === 'INBOUND' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <PhoneIncoming className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">Inbound Campaign</p>
                          <p className="text-xs text-blue-700 mt-1">
                            This campaign will receive incoming calls. No lead list needed - callers will dial your phone number to reach your agent.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCampaign} disabled={isCreating}>
                      {isCreating ? "Creating..." : "Create Campaign"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Table Section */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="border-b bg-gray-50/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Campaigns</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Manage your outreach campaigns and track performance
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search campaigns..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 w-full sm:w-64"
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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <SkeletonTable rows={5} columns={8} />
              </div>
            ) : filteredCampaigns?.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No campaigns found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Create your first campaign to get started</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Campaign Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Phone Numbers</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCampaigns?.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                              <span>{campaign.name}</span>
                            </div>
                            {campaign.livekitTrunk && (
                              <div className="flex items-center gap-1">
                                {campaign.livekitTrunk.status === 'ACTIVE' ? (
                                  <>
                                    <Wifi className="h-3 w-3 text-green-500 animate-pulse" />
                                    <span className="text-xs text-green-600 dark:text-green-400">Trunk Active</span>
                                  </>
                                ) : campaign.livekitTrunk.status === 'PROVISIONING' ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />
                                    <span className="text-xs text-yellow-600 dark:text-yellow-400">Provisioning</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-600 dark:text-red-400">Trunk Error</span>
                                  </>
                                )}
                                {campaign.livekitTrunk.livekitTrunkId && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                                    ID: {campaign.livekitTrunk.livekitTrunkId.slice(-8)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={campaign.campaignType === 'INBOUND' ? 'default' : 'secondary'} className="gap-1">
                            {campaign.campaignType === 'INBOUND' ? (
                              <PhoneIncoming className="h-3 w-3" />
                            ) : (
                              <PhoneOutgoing className="h-3 w-3" />
                            )}
                            {campaign.campaignType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={campaign.status}
                            type={
                              campaign.status === 'ACTIVE' ? 'success' :
                              campaign.status === 'PAUSED' ? 'warning' :
                              campaign.status === 'COMPLETED' ? 'info' :
                              'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {campaign.campaignAgents && campaign.campaignAgents.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{campaign.campaignAgents[0].agent.name}</span>
                              {campaign.campaignAgents.length > 1 && (
                                <span className="text-xs text-gray-500">+{campaign.campaignAgents.length - 1}</span>
                              )}
                            </div>
                          ) : campaign.agentName ? (
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{campaign.agentName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No agent</span>
                          )}
                        </TableCell>                        <TableCell>
                          {campaign.phoneNumbers && campaign.phoneNumbers.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm">{campaign.phoneNumbers.length}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {campaign._count?.leads !== undefined ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-sm font-medium">{campaign._count.leads}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(campaign.createdAt).toLocaleDateString()}
                          </span>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(campaign.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}/leads`)}>
                                <Users className="h-4 w-4 mr-2" />
                                Manage Leads ({campaign._count?.leads || 0})
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {campaign.status === 'completed' ? (
                                <DropdownMenuItem onClick={() => handleRestartCampaign(campaign.id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Restart Campaign
                                </DropdownMenuItem>
                              ) : (
                                <>
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(campaign.id, 'ACTIVE')}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Activate Campaign
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleStatusUpdate(campaign.id, 'PAUSED')}>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause Campaign
                                  </DropdownMenuItem>
                                </>
                              )}
                              {campaign.livekitTrunk && (
                                <DropdownMenuItem onClick={() => viewTrunkDetails(campaign)}>
                                  <Wifi className="h-4 w-4 mr-2" />
                                  View Trunk Details
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns?.length || 0)} of {filteredCampaigns?.length || 0} results
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
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  );
}

export default withAuth(Campaigns);