import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  AiOutlineDashboard,
  AiOutlinePhone,
  AiOutlineLogout,
  AiOutlineUser,
  AiOutlineSetting,
  AiOutlineRobot,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineApi,
} from "react-icons/ai";
import { Building2, Network, ChevronDown, Check, BarChart3, MessageSquare } from "lucide-react";
import { authService } from "@/services/authService";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
}

function Navigation() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [showTenantDropdown, setShowTenantDropdown] = useState(false);

  // Check if user is admin and get current user
  useEffect(() => {
    setIsAdmin(authService.isAdmin());
    setCurrentUser(authService.getCurrentUser());
    setActiveTenantId(authService.getActiveTenantId());
  }, []);

  // Fetch tenants for super admins
  useEffect(() => {
    if (isAdmin) {
      fetchTenants();
    }
  }, [isAdmin]);

  // Update active tenant when it changes
  useEffect(() => {
    if (activeTenantId && tenants.length > 0) {
      const tenant = tenants.find(t => t.id === activeTenantId);
      setActiveTenant(tenant || null);
    }
  }, [activeTenantId, tenants]);

  const fetchTenants = async () => {
    try {
      const response = await apiClient.get<{
        data: Tenant[];
        pagination: any;
      }>("/tenants?limit=100&isActive=true");
      setTenants(response.data);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const handleTenantSwitch = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      authService.setActiveTenant(tenantId);
      setActiveTenantId(tenantId);
      setActiveTenant(tenant);
      setShowTenantDropdown(false);
      toast.success(`Switched to ${tenant.name}`);

      // Refresh the page to reload data for new tenant
      router.reload();
    }
  };

  const handleLogout = () => {
    authService.logout();
    router.push("/auth");
  };
  const [isOpen, setIsOpen] = useState(false);
  // Three sidebar modes: 'expanded' (256px), 'collapsed' (64px), 'hidden' (0px)
  const [sidebarMode, setSidebarMode] = useState<'expanded' | 'collapsed' | 'hidden'>('collapsed');
  const navigationRef = useRef<HTMLDivElement>(null);

  // Load sidebar mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('sidebar-mode');
    if (savedMode === 'expanded' || savedMode === 'collapsed' || savedMode === 'hidden') {
      setSidebarMode(savedMode);
    }
  }, []);

  // Save sidebar mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-mode', sidebarMode);
  }, [sidebarMode]);

  const isActive = (path: string) => router.pathname === path;

  // Ensure only one navigation instance is rendered
  useEffect(() => {
    if (navigationRef.current) {
      // Check if there are multiple navigation elements
      const existingNavigations = document.querySelectorAll('[data-navigation="main"]');
      if (existingNavigations.length > 1) {
        // Remove duplicate navigation elements
        for (let i = 1; i < existingNavigations.length; i++) {
          existingNavigations[i]?.remove();
        }
      }
    }
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.sidebar') && !target.closest('.hamburger')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Update CSS variable for sidebar width so main content can adjust
  useEffect(() => {
    const widthMap = {
      expanded: '256px',    // w-64 = 256px
      collapsed: '64px',    // w-16 = 64px
      hidden: '0px'         // completely hidden
    };
    const sidebarWidth = widthMap[sidebarMode];
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [sidebarMode]);

  const navigationItems = [
    {
      section: "Overview",
      items: [
        {
          href: "/",
          icon: AiOutlineDashboard,
          label: "Dashboard",
        },
      ]
    },
    {
      section: "Operations",
      items: [
        {
          href: "/campaigns",
          icon: AiOutlinePhone,
          label: "Campaigns",
        },
        {
          href: "/agents",
          icon: AiOutlineRobot,
          label: "AI Agents",
        },
        {
          href: "/lead-lists",
          icon: AiOutlineUser,
          label: "Lead Lists",
        },
        {
          href: "/phone-numbers",
          icon: AiOutlineApi,
          label: "Phone Numbers",
        },
      ]
    },
    {
      section: "Insights",
      items: [
        {
          href: "/reporting",
          icon: BarChart3,
          label: "Analytics",
        },
      ]
    },
  ];

  const adminItems = [
    {
      href: "/users",
      icon: AiOutlineUser,
      label: "Users",
    },
    {
      href: "/trunks",
      icon: Network,
      label: "Trunks",
    },
    {
      href: "/tenants",
      icon: Building2,
      label: "Tenants",
    },
    {
      href: "/demo-agents",
      icon: MessageSquare,
      label: "Demo Agents",
    },
    {
      href: "/settings",
      icon: AiOutlineSetting,
      label: "Settings",
    },
  ];

  return (
    <div ref={navigationRef} data-navigation="main">
      {/* Mobile Header - Only visible on mobile */}
      <div key="mobile-header" className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <svg 
              width="28" 
              height="28" 
              viewBox="0 0 95 70" 
              className="text-[rgb(2,112,224)] flex-shrink-0"
              fill="currentColor"
            >
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_3" data-name="Layer 3">
                  <path d="M95,8.85V34.62a5.85,5.85,0,0,0-1,.67,77.45,77.45,0,0,1-6.62,5.23V8.85ZM18.82,6.26a6,6,0,0,1,1.55-4.19A6.18,6.18,0,0,1,24.77,0a6,6,0,0,1,4.71,2.07,5.54,5.54,0,0,1,1.81,4.19,6.29,6.29,0,0,1-6.52,6.52,6.49,6.49,0,0,1-4.4-1.86A6.9,6.9,0,0,1,18.82,6.26ZM15.41,9.11l9.78,16.14L35.49,9.11H46.4L30.52,34.77V54.7H20V34.77L4.59,9.11ZM37.56,29.19l7.71-14.33v6.52h7.3l-.16,7.55H45.27V42.48q0,3.88,1.55,5.17A11,11,0,0,0,51,49.73l1.91.41-3.52,6.62a2.18,2.18,0,0,0-.52.16l-2.33-.78a14.56,14.56,0,0,1-6.26-3.78,10.27,10.27,0,0,1-2.07-3.93,20.1,20.1,0,0,1-.52-5.07V29.19ZM16.08,46.88q-7.56,5-6.26,8.07,2.74,6.93,18.37,6.78a91.45,91.45,0,0,0,20.7-2.85,1.71,1.71,0,0,0,.52-.26Q55.15,57,60.89,55A5.34,5.34,0,0,0,63,54.44a129.08,129.08,0,0,0,16-7.3,93.39,93.39,0,0,0,8.33-5q3.52-2.33,6.62-4.81a3.32,3.32,0,0,1,1-.88q10.71-9.42,8.12-16-1.09-2.07-4.45-1.81,14.07-3.78,16,1,2.43,6.26-12.42,20.18-3.52,2.9-7.3,5.74-3.52,2.48-7.14,4.81A143.16,143.16,0,0,1,63.64,61.22q-23.34,7.71-42,8.23Q2.78,70,.3,63.55-2.19,57.44,16.08,46.88Zm69.19-5.74H60a9.38,9.38,0,0,0,2.23,5,8.66,8.66,0,0,0,6.62,2.33q3.52-.36,5.49-.78Q68.81,50.3,63,52.47q-1.19.41-2.07.78a15.71,15.71,0,0,1-6.11-5.85,16.21,16.21,0,0,1-2.48-9.11q0-8,4.66-12.89A14.78,14.78,0,0,1,68.29,21a15.6,15.6,0,0,1,8.9,2,14.89,14.89,0,0,1,6,6.26q2.12,3.62,2.12,10.66ZM68.55,27.74A8.84,8.84,0,0,0,62.34,30,7,7,0,0,0,60,35.29H77.3a7.33,7.33,0,0,0-2.48-5.49A9.08,9.08,0,0,0,68.55,27.74Z"/>
                </g>
              </g>
            </svg>
          </div>
          <button
            className="hamburger p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? (
              <AiOutlineClose className="h-6 w-6" />
            ) : (
              <AiOutlineMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Only visible on desktop, slides in on mobile when open */}
      <div key="sidebar" className={`
        sidebar fixed left-0 top-0 h-full ${sidebarMode === 'expanded' ? 'w-64' : sidebarMode === 'collapsed' ? 'w-16' : 'w-0'} bg-[#2A3F54] shadow-2xl z-50 transform transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarMode === 'hidden' ? 'lg:-translate-x-full overflow-hidden' : 'lg:translate-x-0'}
      `}>
        {/* Logo/Brand */}
        <div className={`flex-shrink-0 flex items-center ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'justify-between px-4'} py-5 border-b border-[#1f2f3f]/50`}>
          <div className={`flex items-center ${sidebarMode === 'collapsed' ? '' : 'space-x-3'}`}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 95 70" 
              className="text-white flex-shrink-0"
              fill="currentColor"
            >
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_3" data-name="Layer 3">
                  <path d="M95,8.85V34.62a5.85,5.85,0,0,0-1,.67,77.45,77.45,0,0,1-6.62,5.23V8.85ZM18.82,6.26a6,6,0,0,1,1.55-4.19A6.18,6.18,0,0,1,24.77,0a6,6,0,0,1,4.71,2.07,5.54,5.54,0,0,1,1.81,4.19,6.29,6.29,0,0,1-6.52,6.52,6.49,6.49,0,0,1-4.4-1.86A6.9,6.9,0,0,1,18.82,6.26ZM15.41,9.11l9.78,16.14L35.49,9.11H46.4L30.52,34.77V54.7H20V34.77L4.59,9.11ZM37.56,29.19l7.71-14.33v6.52h7.3l-.16,7.55H45.27V42.48q0,3.88,1.55,5.17A11,11,0,0,0,51,49.73l1.91.41-3.52,6.62a2.18,2.18,0,0,0-.52.16l-2.33-.78a14.56,14.56,0,0,1-6.26-3.78,10.27,10.27,0,0,1-2.07-3.93,20.1,20.1,0,0,1-.52-5.07V29.19ZM16.08,46.88q-7.56,5-6.26,8.07,2.74,6.93,18.37,6.78a91.45,91.45,0,0,0,20.7-2.85,1.71,1.71,0,0,0,.52-.26Q55.15,57,60.89,55A5.34,5.34,0,0,0,63,54.44a129.08,129.08,0,0,0,16-7.3,93.39,93.39,0,0,0,8.33-5q3.52-2.33,6.62-4.81a3.32,3.32,0,0,1,1-.88q10.71-9.42,8.12-16-1.09-2.07-4.45-1.81,14.07-3.78,16,1,2.43,6.26-12.42,20.18-3.52,2.9-7.3,5.74-3.52,2.48-7.14,4.81A143.16,143.16,0,0,1,63.64,61.22q-23.34,7.71-42,8.23Q2.78,70,.3,63.55-2.19,57.44,16.08,46.88Zm69.19-5.74H60a9.38,9.38,0,0,0,2.23,5,8.66,8.66,0,0,0,6.62,2.33q3.52-.36,5.49-.78Q68.81,50.3,63,52.47q-1.19.41-2.07.78a15.71,15.71,0,0,1-6.11-5.85,16.21,16.21,0,0,1-2.48-9.11q0-8,4.66-12.89A14.78,14.78,0,0,1,68.29,21a15.6,15.6,0,0,1,8.9,2,14.89,14.89,0,0,1,6,6.26q2.12,3.62,2.12,10.66ZM68.55,27.74A8.84,8.84,0,0,0,62.34,30,7,7,0,0,0,60,35.29H77.3a7.33,7.33,0,0,0-2.48-5.49A9.08,9.08,0,0,0,68.55,27.74Z"/>
                </g>
              </g>
            </svg>
            {sidebarMode !== 'collapsed' && (
              <div>
                <p className="text-xs text-gray-300 font-medium">AI Voice Platform</p>
              </div>
            )}
          </div>
          {sidebarMode === 'expanded' && (
            <button
              onClick={() => setSidebarMode('collapsed')}
              className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:bg-[#1f2f3f] hover:text-white transition-all duration-200"
              title="Collapse sidebar"
            >
              <AiOutlineClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand/Hide buttons when collapsed */}
        {sidebarMode === 'collapsed' && (
          <div className="flex-shrink-0 hidden lg:flex justify-center gap-2 py-3 border-b border-[#1f2f3f]/50">
            <button
              onClick={() => setSidebarMode('expanded')}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-[#1f2f3f] hover:text-white transition-all duration-200"
              title="Expand sidebar"
            >
              <AiOutlineMenu className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSidebarMode('hidden')}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-[#1f2f3f] hover:text-white transition-all duration-200"
              title="Hide sidebar"
            >
              <AiOutlineClose className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#1f2f3f] scrollbar-track-transparent">
          <div className="space-y-4">
            {navigationItems.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-1">
                {/* Section Label */}
                {sidebarMode !== 'collapsed' && (
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {section.section}
                    </h3>
                  </div>
                )}

                {/* Section Items */}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          group flex items-center ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden
                          ${active
                            ? "bg-[#1ABB9C] text-white shadow-md"
                            : "text-gray-300 hover:bg-[#1f2f3f] hover:text-white"
                          }
                        `}
                        title={sidebarMode === 'collapsed' ? item.label : undefined}
                      >
                        {active && sidebarMode !== 'collapsed' && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#169F85] rounded-r-full"></div>
                        )}
                        <Icon className={`h-4.5 w-4.5 ${sidebarMode === 'collapsed' ? '' : 'mr-3'} transition-all duration-200 flex-shrink-0 ${
                          active ? "text-white" : "text-gray-400 group-hover:text-white"
                        }`} />
                        {sidebarMode !== 'collapsed' && (
                          <span className="flex-1 font-medium">{item.label}</span>
                        )}
                        {sidebarMode !== 'collapsed' && active && (
                          <div className="ml-auto">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Admin Navigation Items - Only for admins - Inside main nav */}
            {isAdmin && (
              <div className="space-y-1 pt-3 mt-3 border-t border-gray-200">
                {/* Admin Section Header */}
                {sidebarMode !== 'collapsed' && (
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</h3>
                  </div>
                )}

                {/* Admin Navigation Items */}
                <div className="space-y-0.5">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          group flex items-center ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden
                          ${active
                            ? "bg-[#1ABB9C] text-white shadow-md"
                            : "text-gray-300 hover:bg-[#1f2f3f] hover:text-white"
                          }
                        `}
                        title={sidebarMode === 'collapsed' ? item.label : undefined}
                      >
                        {active && sidebarMode !== 'collapsed' && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#169F85] rounded-r-full"></div>
                        )}
                        <Icon className={`h-4.5 w-4.5 ${sidebarMode === 'collapsed' ? '' : 'mr-3'} transition-all duration-200 flex-shrink-0 ${
                          active ? "text-white" : "text-gray-400 group-hover:text-white"
                        }`} />
                        {sidebarMode !== 'collapsed' && (
                          <span className="flex-1 font-medium">{item.label}</span>
                        )}
                        {sidebarMode !== 'collapsed' && active && (
                          <div className="ml-auto">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section - Tenant, User Profile & Logout */}
        <div className="flex-shrink-0 border-t border-[#1f2f3f]/50 bg-[#2A3F54]">

          {/* Tenant Switcher - Only for super admins */}
          {isAdmin && sidebarMode !== 'collapsed' && (
            <div className="px-3 pt-3 pb-2">
              <div className="relative">
                <button
                  onClick={() => setShowTenantDropdown(!showTenantDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-blue-300 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <Building2 className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 font-medium truncate">
                        {activeTenant?.name || "Select Tenant"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform flex-shrink-0 ${showTenantDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Tenant Dropdown */}
                {showTenantDropdown && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
                    {tenants.length === 0 ? (
                      <div className="px-4 py-3 text-center text-sm text-gray-500">
                        No tenants available
                      </div>
                    ) : (
                      tenants.map((tenant) => (
                        <button
                          key={tenant.id}
                          onClick={() => handleTenantSwitch(tenant.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                            activeTenantId === tenant.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <Building2 className={`h-4 w-4 flex-shrink-0 ${
                            activeTenantId === tenant.id ? "text-blue-600" : "text-gray-400"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {tenant.name}
                            </p>
                            {tenant.domain && (
                              <p className="text-xs text-gray-500 truncate">
                                {tenant.domain}
                              </p>
                            )}
                          </div>
                          {activeTenantId === tenant.id && (
                            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Profile Section - For ALL users */}
          {sidebarMode !== 'collapsed' && (
            <div className="px-3 py-2 border-t border-[#1f2f3f]/50">
              <Link href="/profile">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#1f2f3f] border border-[#1f2f3f] cursor-pointer hover:bg-[#1ABB9C] hover:border-[#1ABB9C] transition-all duration-200 group">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <AiOutlineUser className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{currentUser?.name || 'User'}</p>
                    <p className="text-xs text-gray-400 truncate">{currentUser?.email || ''}</p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          )}

          {/* Notifications, Theme Toggle & Sign Out - For ALL users */}
          {sidebarMode !== 'hidden' && (
            <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
              {/* Notifications & Theme Toggle */}
              <div className={`flex items-center gap-2 ${sidebarMode === 'collapsed' ? 'justify-center' : 'justify-start px-3'}`}>
                <NotificationCenter />
                <ThemeToggle />
              </div>

              {/* Sign Out Button */}
              <Button
                variant="ghost"
                className={`w-full ${sidebarMode === 'collapsed' ? 'justify-center px-3' : 'justify-start'} bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 hover:border-red-200 dark:hover:border-red-800 transition-all duration-200 rounded-lg py-2`}
                onClick={handleLogout}
                title={sidebarMode === 'collapsed' ? "Sign Out" : undefined}
              >
                <AiOutlineLogout className={`h-4 w-4 ${sidebarMode === 'collapsed' ? '' : 'mr-2'}`} />
                {sidebarMode !== 'collapsed' && <span className="font-medium text-sm">Sign Out</span>}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating toggle button when sidebar is hidden - Desktop only */}
      {sidebarMode === 'hidden' && (
        <button
          onClick={() => setSidebarMode('collapsed')}
          className="hidden lg:flex fixed top-20 right-4 z-50 p-3 rounded-lg bg-[#2A3F54] text-white shadow-2xl hover:bg-[#1ABB9C] transition-all duration-200 items-center justify-center"
          title="Show sidebar"
          aria-label="Show sidebar"
        >
          <AiOutlineMenu className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export { Navigation };
