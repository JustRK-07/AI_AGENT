"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Search,
  Home,
  Bot,
  Phone,
  Users,
  BarChart3,
  Settings,
  Building2,
  Network,
  MessageSquare,
  Zap,
} from "lucide-react";
import { agentsService } from "@/services/agentsService";
import { campaignsService } from "@/services/campaignsService";
import { phoneNumbersService } from "@/services/phoneNumbersService";

interface SearchResult {
  id: string;
  type: "page" | "agent" | "campaign" | "number" | "action";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Static navigation items
  const navigationItems: SearchResult[] = [
    {
      id: "nav-dashboard",
      type: "page",
      title: "Dashboard",
      subtitle: "View overview and statistics",
      icon: <Home className="h-4 w-4" />,
      action: () => router.push("/"),
    },
    {
      id: "nav-agents",
      type: "page",
      title: "AI Agents",
      subtitle: "Manage your AI agents",
      icon: <Bot className="h-4 w-4" />,
      action: () => router.push("/agents"),
    },
    {
      id: "nav-campaigns",
      type: "page",
      title: "Campaigns",
      subtitle: "Manage your campaigns",
      icon: <Phone className="h-4 w-4" />,
      action: () => router.push("/campaigns"),
    },
    {
      id: "nav-leads",
      type: "page",
      title: "Lead Lists",
      subtitle: "Manage lead lists",
      icon: <Users className="h-4 w-4" />,
      action: () => router.push("/lead-lists"),
    },
    {
      id: "nav-numbers",
      type: "page",
      title: "Phone Numbers",
      subtitle: "Manage phone numbers",
      icon: <Zap className="h-4 w-4" />,
      action: () => router.push("/phone-numbers"),
    },
    {
      id: "nav-analytics",
      type: "page",
      title: "Analytics",
      subtitle: "View reports and analytics",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => router.push("/reporting"),
    },
    {
      id: "nav-settings",
      type: "page",
      title: "Settings",
      subtitle: "Manage settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push("/settings"),
    },
  ];

  // Search dynamic content (agents, campaigns, etc.)
  const searchDynamicContent = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults(navigationItems);
      return;
    }

    setLoading(true);
    try {
      const [agentsRes, campaignsRes, numbersRes] = await Promise.all([
        agentsService.getAll({ search: query, limit: 5 }).catch(() => ({ agents: [] })),
        campaignsService.getAll().catch(() => ({ campaigns: [] })),
        phoneNumbersService.getAll().catch(() => ({ data: [] })),
      ]);

      const dynamicResults: SearchResult[] = [];

      // Add matching agents
      (agentsRes.agents || []).forEach((agent: any) => {
        if (agent.name.toLowerCase().includes(query.toLowerCase())) {
          dynamicResults.push({
            id: `agent-${agent.id}`,
            type: "agent",
            title: agent.name,
            subtitle: agent.description || "AI Agent",
            icon: <Bot className="h-4 w-4" />,
            action: () => router.push(`/agents/${agent.id}`),
          });
        }
      });

      // Add matching campaigns
      (campaignsRes.campaigns || []).forEach((campaign: any) => {
        if (campaign.name.toLowerCase().includes(query.toLowerCase())) {
          dynamicResults.push({
            id: `campaign-${campaign.id}`,
            type: "campaign",
            title: campaign.name,
            subtitle: `Campaign - ${campaign.status}`,
            icon: <Phone className="h-4 w-4" />,
            action: () => router.push(`/campaigns/${campaign.id}`),
          });
        }
      });

      // Add matching numbers
      (numbersRes.data || []).forEach((number: any) => {
        if (number.number.includes(query)) {
          dynamicResults.push({
            id: `number-${number.id}`,
            type: "number",
            title: number.number,
            subtitle: `Phone Number - ${number.status}`,
            icon: <Zap className="h-4 w-4" />,
            action: () => router.push(`/phone-numbers/${number.id}`),
          });
        }
      });

      // Filter navigation items
      const filteredNav = navigationItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );

      setResults([...filteredNav, ...dynamicResults]);
    } catch (error) {
      console.error("Search error:", error);
      setResults(navigationItems);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Handle search query changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDynamicContent(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchDynamicContent]);

  // Keyboard shortcut: Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const groupTitles: Record<string, string> = {
    page: "Pages",
    agent: "Agents",
    campaign: "Campaigns",
    number: "Phone Numbers",
    action: "Actions",
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search for pages, agents, campaigns..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {loading ? (
          <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Searching...
          </div>
        ) : results.length === 0 ? (
          <CommandEmpty>
            <div className="py-6 text-center">
              <Search className="h-10 w-10 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            </div>
          </CommandEmpty>
        ) : (
          Object.entries(groupedResults).map(([type, items], groupIndex) => (
            <div key={type}>
              {groupIndex > 0 && <CommandSeparator />}
              <CommandGroup heading={groupTitles[type] || type}>
                {items.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => {
                      result.action();
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))
        )}
      </CommandList>

      {/* Keyboard shortcut hint */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">ESC</kbd> to close</span>
        <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 font-mono">↑↓</kbd> to navigate</span>
      </div>
    </CommandDialog>
  );
}
