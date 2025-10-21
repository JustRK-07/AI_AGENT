import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Plus,
  Search,
  Edit,
  Power,
  PowerOff,
  Loader2,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/apiClient";
import { authService } from "@/services/authService";

interface DemoAgent {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  systemPrompt: string | null;
  voiceId: string | null;
  personality: string | null;
  llmProvider: string | null;
  llmModel: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DemoAgentsPage() {
  const router = useRouter();
  const [demoAgents, setDemoAgents] = useState<DemoAgent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<DemoAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<DemoAgent | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    title: "",
    description: "",
    icon: "",
    systemPrompt: "",
    voiceId: "default",
    personality: "",
    llmProvider: "openai",
    llmModel: "gpt-4o-mini",
    displayOrder: 0,
    isActive: true,
  });

  // Check admin access
  useEffect(() => {
    if (!authService.isAdmin()) {
      toast.error("Access denied. This page is only available to administrators.");
      router.push("/");
    }
  }, [router]);

  // Fetch demo agents
  const fetchDemoAgents = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ data: DemoAgent[]; total: number }>(
        "/demo-agents?showAll=true"
      );
      setDemoAgents(response.data);
      setFilteredAgents(response.data);
    } catch (error: any) {
      console.error("Error fetching demo agents:", error);
      toast.error("Failed to load demo agents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoAgents();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredAgents(demoAgents);
    } else {
      const filtered = demoAgents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          agent.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchTerm, demoAgents]);

  // Create demo agent
  const handleCreate = async () => {
    try {
      await apiClient.post("/demo-agents", formData);
      toast.success("Demo agent created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDemoAgents();
    } catch (error: any) {
      console.error("Error creating demo agent:", error);
      toast.error(error.response?.data?.error?.message || "Failed to create demo agent");
    }
  };

  // Update demo agent
  const handleUpdate = async () => {
    if (!selectedAgent) return;

    try {
      await apiClient.put(`/demo-agents/${selectedAgent.id}`, formData);
      toast.success("Demo agent updated successfully");
      setIsEditDialogOpen(false);
      setSelectedAgent(null);
      resetForm();
      fetchDemoAgents();
    } catch (error: any) {
      console.error("Error updating demo agent:", error);
      toast.error(error.response?.data?.error?.message || "Failed to update demo agent");
    }
  };

  // Delete demo agent - DISABLED: Agents should only be deactivated, not deleted
  const handleDelete = async () => {
    if (!selectedAgent) return;

    // Instead of deleting, deactivate the agent
    try {
      await apiClient.patch(`/demo-agents/${selectedAgent.id}/toggle`);
      toast.success("Demo agent deactivated successfully");
      setIsDeleteDialogOpen(false);
      setSelectedAgent(null);
      fetchDemoAgents();
    } catch (error: any) {
      console.error("Error deactivating demo agent:", error);
      toast.error(error.response?.data?.error?.message || "Failed to deactivate demo agent");
    }
  };

  // Toggle active status
  const handleToggleStatus = async (agent: DemoAgent) => {
    try {
      await apiClient.patch(`/demo-agents/${agent.id}/toggle`);
      toast.success(`Demo agent ${agent.isActive ? "deactivated" : "activated"} successfully`);
      fetchDemoAgents();
    } catch (error: any) {
      console.error("Error toggling demo agent status:", error);
      toast.error("Failed to toggle demo agent status");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      title: "",
      description: "",
      icon: "",
      systemPrompt: "",
      voiceId: "default",
      personality: "",
      llmProvider: "openai",
      llmModel: "gpt-4o-mini",
      displayOrder: 0,
      isActive: true,
    });
  };

  // Open edit dialog
  const openEditDialog = (agent: DemoAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      slug: agent.slug,
      title: agent.title,
      description: agent.description || "",
      icon: agent.icon || "",
      systemPrompt: agent.systemPrompt || "",
      voiceId: agent.voiceId || "default",
      personality: agent.personality || "",
      llmProvider: agent.llmProvider || "openai",
      llmModel: agent.llmModel || "gpt-4o-mini",
      displayOrder: agent.displayOrder,
      isActive: agent.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (agent: DemoAgent) => {
    setSelectedAgent(agent);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Demo Agents Management</h1>
          <p className="text-gray-600">Manage AI demo agents for the landing page</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search demo agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Create Button */}
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Demo Agent</span>
            </button>
          </div>
        </div>

        {/* Demo Agents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No demo agents found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Try adjusting your search" : "Get started by creating your first demo agent"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Create Demo Agent</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{agent.title}</h3>
                    <p className="text-sm text-gray-500">Slug: {agent.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.isActive ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        <Power className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        <PowerOff className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">{agent.description || "No description"}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Order: {agent.displayOrder}</span>
                    <span>LLM: {agent.llmProvider}/{agent.llmModel}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleStatus(agent)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      agent.isActive
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-green-100 hover:bg-green-200 text-green-700"
                    }`}
                  >
                    {agent.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    <span className="text-sm">{agent.isActive ? "Deactivate" : "Activate"}</span>
                  </button>
                  <button
                    onClick={() => openEditDialog(agent)}
                    className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                    title="Edit agent"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        {isCreateDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Create Demo Agent</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Internal name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="restaurant-booking"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Display title on landing page"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Short description for landing page"
                  />
                </div>

                {/* AI Configuration */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">AI Configuration</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                    <textarea
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Agent's system prompt..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LLM Provider</label>
                      <select
                        value={formData.llmProvider}
                        onChange={(e) => setFormData({ ...formData, llmProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="cerebras">Cerebras</option>
                        <option value="groq">Groq</option>
                        <option value="google">Google</option>
                        <option value="amazon">Amazon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LLM Model</label>
                      <input
                        type="text"
                        value={formData.llmModel}
                        onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="gpt-4o-mini"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voice ID</label>
                      <input
                        type="text"
                        value={formData.voiceId}
                        onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="default"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Agent personality traits..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Dialog - Same as Create but with Update */}
        {isEditDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Edit Demo Agent</h2>
              </div>
              <div className="p-6 space-y-4">
                {/* Same form fields as Create dialog */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">AI Configuration</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
                    <textarea
                      value={formData.systemPrompt}
                      onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LLM Provider</label>
                      <select
                        value={formData.llmProvider}
                        onChange={(e) => setFormData({ ...formData, llmProvider: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="openai">OpenAI</option>
                        <option value="cerebras">Cerebras</option>
                        <option value="groq">Groq</option>
                        <option value="google">Google</option>
                        <option value="amazon">Amazon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LLM Model</label>
                      <input
                        type="text"
                        value={formData.llmModel}
                        onChange={(e) => setFormData({ ...formData, llmModel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Voice ID</label>
                      <input
                        type="text"
                        value={formData.voiceId}
                        onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Personality</label>
                    <textarea
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedAgent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Dialog - Changed to Deactivate Dialog */}
        {isDeleteDialogOpen && selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Deactivate Demo Agent</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to deactivate <strong>{selectedAgent.title}</strong>?
                  The agent will remain in the system and can be reactivated later.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setSelectedAgent(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
