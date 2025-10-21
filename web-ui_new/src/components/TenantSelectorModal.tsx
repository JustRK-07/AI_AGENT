/**
 * Tenant Selector Modal
 * Shown to super admins on login to select their active tenant
 */

import { useState, useEffect } from "react";
import { apiClient } from "@/services/apiClient";
import { authService } from "@/services/authService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  createdAt: string;
}

interface TenantSelectorModalProps {
  isOpen: boolean;
  onSelect: (tenantId: string) => void;
  onClose?: () => void;
}

export function TenantSelectorModal({
  isOpen,
  onSelect,
  onClose,
}: TenantSelectorModalProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all tenants
  useEffect(() => {
    if (isOpen) {
      fetchTenants();
    }
  }, [isOpen]);

  // Filter tenants based on search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTenants(tenants);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTenants(
        tenants.filter(
          (tenant) =>
            tenant.name.toLowerCase().includes(query) ||
            tenant.domain?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, tenants]);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{
        data: Tenant[];
        pagination: any;
      }>("/tenants?limit=100&isActive=true");

      setTenants(response.data);
      setFilteredTenants(response.data);

      // Pre-select current tenant if one is set
      const currentTenantId = authService.getActiveTenantId();
      if (currentTenantId) {
        setSelectedTenantId(currentTenantId);
      }
    } catch (error: any) {
      console.error("Error fetching tenants:", error);
      setError("Failed to load tenants. Please try again.");
      toast.error("Failed to load tenants");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };

  const handleConfirm = () => {
    if (!selectedTenantId) {
      toast.error("Please select a tenant");
      return;
    }

    // Save selected tenant
    authService.setActiveTenant(selectedTenantId);

    const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
    toast.success(`Switched to ${selectedTenant?.name || "tenant"}`);

    // Call callback
    onSelect(selectedTenantId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-6 w-6 text-blue-600" />
            Select Active Tenant
          </DialogTitle>
          <DialogDescription>
            Choose which tenant you want to manage. You can switch tenants anytime from the sidebar.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tenants by name or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tenant List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Loading tenants...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-red-500">
                <p className="text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTenants}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">
                  {searchQuery ? "No tenants found" : "No active tenants available"}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => handleSelectTenant(tenant.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedTenantId === tenant.id
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {tenant.name}
                        </p>
                        {tenant.isActive && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      {tenant.domain && (
                        <p className="text-sm text-gray-500 truncate">
                          {tenant.domain}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {tenant.id}
                      </p>
                    </div>
                    {selectedTenantId === tenant.id && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-500">
            {filteredTenants.length} tenant{filteredTenants.length !== 1 ? "s" : ""} available
          </p>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button
              onClick={handleConfirm}
              disabled={!selectedTenantId || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TenantSelectorModal;
