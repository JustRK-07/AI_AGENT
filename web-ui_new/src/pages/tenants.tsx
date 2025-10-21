"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Mail,
  Phone,
  MapPin,
  Users,
  Filter,
  MoreVertical,
  Eye,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { authService } from "@/services/authService";
import { withAuth } from "@/components/withAuth";

interface Tenant {
  id: string;
  tenantId?: string;
  name: string;
  domain: string | null;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  maxUsers?: number;
  currentUsers?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import { apiClient } from "@/services/apiClient";

function Tenants() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [permanentDelete, setPermanentDelete] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: "",
    name: "",
    domain: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    maxUsers: 10,
    isActive: true,
  });

  // Check admin access
  useEffect(() => {
    if (!authService.isAdmin()) {
      toast.error('Access denied. This page is only available to administrators.');
      router.push('/');
    }
  }, [router]);

  // Get active tenant ID
  useEffect(() => {
    const currentTenantId = authService.getActiveTenantId();
    setActiveTenantId(currentTenantId);
  }, []);

  // Fetch tenants from API
  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        data: Tenant[];
        pagination: any;
      }>("/tenants?limit=100");
      setTenants(response.data);
      setFilteredTenants(response.data);
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tenants
  useEffect(() => {
    let filtered = tenants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((t) => t.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((t) => !t.isActive);
    }

    setFilteredTenants(filtered);
  }, [searchTerm, statusFilter, tenants]);

  const handleCreate = () => {
    setFormData({
      tenantId: "",
      name: "",
      domain: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      maxUsers: 10,
      isActive: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      tenantId: tenant.tenantId || "",
      name: tenant.name,
      domain: tenant.domain,
      description: tenant.description || "",
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone || "",
      address: tenant.address || "",
      maxUsers: tenant.maxUsers,
      isActive: tenant.isActive,
    });
    setEditDialogOpen(true);
  };

  const handleView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setViewDialogOpen(true);
  };

  const handleDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      const newStatus = !tenant.isActive;
      await apiClient.put(`/tenants/${tenant.id}`, {
        isActive: newStatus,
      });

      // Refresh tenants list
      await fetchTenants();
      toast.success(
        `Tenant ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error: any) {
      console.error("Error toggling tenant status:", error);
      toast.error("Failed to update tenant status");
    }
  };

  const submitCreate = async () => {
    try {
      setIsLoading(true);
      await apiClient.post("/tenants", formData);

      // Refresh tenants list
      await fetchTenants();
      setCreateDialogOpen(false);
      toast.success("Tenant created successfully");
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast.error(error.error || "Failed to create tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedTenant) return;

    try {
      setIsLoading(true);
      await apiClient.put(`/tenants/${selectedTenant.id}`, formData);

      // Refresh tenants list
      await fetchTenants();
      setEditDialogOpen(false);
      toast.success("Tenant updated successfully");
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      toast.error(error.error || "Failed to update tenant");
    } finally {
      setIsLoading(false);
    }
  };

  const submitDelete = async () => {
    if (!selectedTenant) return;

    try {
      setIsLoading(true);
      await apiClient.delete(`/tenants/${selectedTenant.id}`);

      // Refresh tenants list
      await fetchTenants();
      setDeleteDialogOpen(false);
      toast.success("Tenant deleted successfully");
    } catch (error: any) {
      console.error("Error deleting tenant:", error);
      toast.error(error.error || "Failed to delete tenant");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Tenant Management - Ytel</title>
        <meta name="description" content="Manage tenants" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
        <div className="max-w-9xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Tenant Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage organizations and their configurations
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Tenant
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tenants</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tenants.length}
                    </p>
                  </div>
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {tenants.filter((t) => t.isActive).length}
                    </p>
                  </div>
                  <Power className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {tenants.filter((t) => !t.isActive).length}
                    </p>
                  </div>
                  <PowerOff className="h-8 w-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {tenants.reduce((sum, t) => sum + (t.currentUsers || 0), 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, domain, email, or tenant ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tenants</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tenants List */}
          {isLoading && tenants.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading tenants...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
            {filteredTenants.map((tenant) => (
              <Card
                key={tenant.id}
                className={`transition-all hover:shadow-lg ${
                  !tenant.isActive ? "opacity-60" : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            tenant.isActive
                              ? "bg-green-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Building2
                            className={`h-5 w-5 ${
                              tenant.isActive
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            {tenant.name}
                            {activeTenantId === tenant.id && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                Current
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {tenant.domain}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tenant.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tenant.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {tenant.description && (
                        <p className="text-gray-600 mb-4">
                          {tenant.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tenant.contactEmail && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {tenant.contactEmail}
                            </span>
                          </div>
                        )}
                        {tenant.contactPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {tenant.contactPhone}
                            </span>
                          </div>
                        )}
                        {(tenant.maxUsers !== undefined || tenant.currentUsers !== undefined) && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">
                              {tenant.currentUsers || 0} / {tenant.maxUsers || "∞"} users
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(tenant)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(tenant)}
                        >
                          {tenant.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(tenant)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredTenants.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tenants found</p>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Add a new organization to the system
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant ID (optional)</Label>
                <Input
                  id="tenantId"
                  placeholder="my-organization"
                  value={formData.tenantId}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain *</Label>
              <Input
                id="domain"
                placeholder="acme.ytel.com"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the organization"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@acme.com"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  placeholder="+1-555-0100"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="123 Business St, City, State, ZIP"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users *</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUsers: parseInt(e.target.value) || 10,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Active Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tenantId">Tenant ID</Label>
                <Input
                  id="edit-tenantId"
                  value={formData.tenantId}
                  onChange={(e) =>
                    setFormData({ ...formData, tenantId: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Organization Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-domain">Domain *</Label>
              <Input
                id="edit-domain"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-contactEmail">Contact Email *</Label>
                <Input
                  id="edit-contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contactPhone">Contact Phone</Label>
                <Input
                  id="edit-contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxUsers">Max Users *</Label>
                <Input
                  id="edit-maxUsers"
                  type="number"
                  min="1"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUsers: parseInt(e.target.value) || 10,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-isActive">Active Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="edit-isActive" className="cursor-pointer">
                    {formData.isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Tenant ID</Label>
                  <p className="font-mono text-sm mt-1">
                    {selectedTenant.tenantId || "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTenant.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedTenant.isActive ? "Active" : "Inactive"}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Organization Name</Label>
                <p className="font-semibold mt-1">{selectedTenant.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">Domain</Label>
                <p className="mt-1">{selectedTenant.domain}</p>
              </div>
              {selectedTenant.description && (
                <div>
                  <Label className="text-gray-500">Description</Label>
                  <p className="mt-1">{selectedTenant.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Contact Email</Label>
                  <p className="mt-1">{selectedTenant.contactEmail}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Contact Phone</Label>
                  <p className="mt-1">
                    {selectedTenant.contactPhone || "N/A"}
                  </p>
                </div>
              </div>
              {selectedTenant.address && (
                <div>
                  <Label className="text-gray-500">Address</Label>
                  <p className="mt-1">{selectedTenant.address}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Users</Label>
                  <p className="mt-1">
                    {selectedTenant.currentUsers || 0} /{" "}
                    {selectedTenant.maxUsers}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Created</Label>
                  <p className="mt-1">
                    {new Date(selectedTenant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedTenant?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This will permanently delete the tenant and all associated data.
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={submitDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default withAuth(Tenants);
