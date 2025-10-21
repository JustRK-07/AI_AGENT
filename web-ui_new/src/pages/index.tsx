"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import { campaignsService } from "@/services/campaignsService";
import { phoneNumbersService } from "@/services/phoneNumbersService";
import { agentsService } from "@/services/agentsService";
import { getDashboardSummary } from "@/services/analyticsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AiOutlineWarning,
  AiOutlinePlus,
  AiOutlinePlayCircle,
  AiOutlinePauseCircle,
  AiOutlineEdit,
  AiOutlineShoppingCart,
  AiOutlineEye,
  AiOutlineUser,
  AiOutlineRobot,
} from "react-icons/ai";
import {
  Phone,
  BarChart3,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { RealTimeDashboard } from "@/components/RealTimeDashboard";
import { StatCard } from "@/components/shared/StatCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import Link from "next/link";
import { withAuth } from "@/components/withAuth";
import { SkeletonCard, SkeletonList } from "@/components/skeletons";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";


function Dashboard() {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseCountry, setPurchaseCountry] = useState("US");
  const [purchaseAreaCode, setPurchaseAreaCode] = useState("");

  // State for dashboard data
  const [overallStats, setOverallStats] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [numbersStats, setNumbersStats] = useState<any>(null);
  const [numbers, setNumbers] = useState<any[]>([]);
  const [agentsStats, setAgentsStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Add minimum loading delay to ensure smooth UX and visible loaders
      const [
        campaignsResponse,
        numbersResponse,
        agentsResponse,
        agentsStatsResponse,
        dashboardSummaryResponse
      ] = await Promise.all([
        campaignsService.getAll(),
        phoneNumbersService.getAll(),
        agentsService.getAll(),
        agentsService.getLoadStats(),
        getDashboardSummary(),
        new Promise(resolve => setTimeout(resolve, 800)) // Minimum 800ms loading time
      ]);

      setCampaigns(campaignsResponse?.campaigns || []);
      setNumbers(numbersResponse?.data || []);
      setNumbersStats({
        totalNumbers: numbersResponse?.data?.length || 0,
        availableNumbers: numbersResponse?.data?.filter((n: any) => n.isActive && !n.campaignId).length || 0,
        assignedNumbers: numbersResponse?.data?.filter((n: any) => n.campaignId).length || 0,
        inactiveNumbers: numbersResponse?.data?.filter((n: any) => !n.isActive).length || 0,
      });
      setAgents(agentsResponse?.agents || []);
      setAgentsStats({
        totalAgents: agentsStatsResponse?.summary?.totalAgents || 0,
        activeAgents: agentsStatsResponse?.summary?.activeAgents || 0,
        inactiveAgents: (agentsStatsResponse?.summary?.totalAgents || 0) - (agentsStatsResponse?.summary?.activeAgents || 0),
      });

      // Get real analytics data from analytics service
      const summary = dashboardSummaryResponse?.data;
      setOverallStats({
        totalCalls: summary?.totalCalls || 0,
        successfulCalls: summary?.completedCalls || 0,
        conversionRate: summary?.successRate || 0,
        totalCampaigns: campaignsResponse?.campaigns?.length || 0,
        activeCampaigns: summary?.activeCampaigns || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchDashboardData();

      // Auto-refresh every 30 seconds (changed from 10s to prevent rate limiting)
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  // Quick actions
  const handleUpdateCampaignStatus = async (campaignId: string, status: string) => {
    try {
      if (status === 'ACTIVE') {
        await campaignsService.start(campaignId);
      } else {
        await campaignsService.pause(campaignId);
      }
      toast.success("Campaign status updated!");
      await fetchDashboardData();
    } catch (error: any) {
      toast.error(`Failed to update campaign: ${error.message}`);
    }
  };

  const handlePurchaseNumber = async () => {
    try {
      setIsPurchasing(true);

      // Search for available numbers
      const searchParams: any = {
        country: purchaseCountry,
      };

      if (purchaseAreaCode) {
        searchParams.areaCode = purchaseAreaCode;
      }

      const availableNumbers = await phoneNumbersService.searchAvailable(searchParams);

      if (!availableNumbers || availableNumbers.length === 0) {
        toast.error("No available numbers found. Try a different area code.");
        return;
      }

      // Purchase the first available number
      const numberToPurchase = availableNumbers[0];
      await phoneNumbersService.purchase({
        phoneNumber: numberToPurchase.phoneNumber,
        friendlyName: `${purchaseCountry} Number`,
      });

      toast.success("Phone number purchased successfully!");
      setShowPurchaseModal(false);
      setPurchaseAreaCode("");
      await fetchDashboardData();
    } catch (error: any) {
      toast.error(`Failed to purchase number: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleQuickStatusUpdate = (campaignId: string, status: "ACTIVE" | "PAUSED") => {
    handleUpdateCampaignStatus(campaignId, status);
  };

  // Calculate summary statistics
  const todayStats = {
    totalCalls: overallStats?.totalCalls || 0,
    completedCalls: overallStats?.successfulCalls || 0,
    successRate: overallStats?.conversionRate ? overallStats.conversionRate.toFixed(1) : "0",
    activeCampaigns: campaigns?.filter(c => c.isActive).length || 0
  };

  return (
    <>
      <Head>
        <title>Dashboard</title>
        <meta name="description" content="Professional Dashboard" />
      </Head>
      <main className="w-full max-w-[1600px] mx-auto px-8 py-4">
        {/* Professional Dashboard Header */}
        <div className="mb-4">
          <div className="rounded-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Stats Overview */}
        <div className="mb-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              <StatCard
                icon={<Phone className="h-6 w-6" />}
                label="Total Calls Today"
                value={todayStats.totalCalls.toLocaleString()}
                iconBgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                icon={<Zap className="h-6 w-6" />}
                label="Successful Calls"
                value={todayStats.completedCalls.toLocaleString()}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <StatCard
                icon={<BarChart3 className="h-6 w-6" />}
                label="Active Campaigns"
                value={todayStats.activeCampaigns}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
              />
              <StatCard
                icon={<AiOutlineRobot className="h-6 w-6" />}
                label="Live Agents"
                value={agentsStats?.activeAgents || 0}
                iconBgColor="bg-orange-100"
                iconColor="text-orange-600"
              />
            </div>
          )}
        </div>

        {/* Real-time Dashboard Component */}
        <div className="mb-5">
          <RealTimeDashboard />
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Quick Actions Section */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Start Guide */}

            {/* Active Agents */}
            <CollapsibleCard
              title="AI Agents"
              subtitle="Your AI agents with current status and call statistics"
              icon={<AiOutlineRobot className="h-5 w-5" />}
              storageKey="dashboard-agents"
              defaultCollapsed={false}
              collapsible={true}
              closeable={false}
              badge={
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
                </div>
              }
            >
              {isLoading ? (
                <SkeletonList items={3} />
              ) : agents && agents.length > 0 ? (
                <div className="space-y-3 animate-fade-in">
                  {agents.slice(0, 3).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          agent.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400 dark:bg-gray-600"
                        }`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{agent.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {agent.voiceId || 'Default'} • {agent.maxConcurrentCalls || 1} max calls
                            {agent._count?.campaignAgents ? ` • ${agent._count.campaignAgents} campaigns` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge
                          status={agent.isActive ? 'ACTIVE' : 'INACTIVE'}
                          type={agent.isActive ? 'success' : 'default'}
                        />
                        <Link href="/agents">
                          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            Manage →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                    <AiOutlineRobot className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No agents yet. Create your first AI agent to get started!</p>
                </div>
              )}
            </CollapsibleCard>
          </div>


            {/* Professional Phone Number Management */}
            <CollapsibleCard
              title="Phone Numbers"
              subtitle="Manage your calling infrastructure"
              icon={<Phone className="h-5 w-5" />}
              storageKey="dashboard-phone-numbers"
              defaultCollapsed={false}
              collapsible={true}
              closeable={false}
              headerClassName="bg-white dark:bg-gray-800"
            >
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  onClick={() => setShowPurchaseModal(true)}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <AiOutlineShoppingCart className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              </div>

              {/* Professional Phone Numbers List */}
              {isLoading ? (
                <div className="mb-4">
                  <SkeletonList items={3} />
                </div>
              ) : (
                <div className="space-y-3 mb-4 animate-fade-in">
                  {numbers?.slice(0, 3).map((number) => (
                    <div key={number.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{number.number}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{number.country} • ${number.monthlyCost}/mo</p>
                      </div>
                      <Badge className={number.status === "AVAILABLE" ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-700" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700"}>
                        {number.status}
                      </Badge>
                    </div>
                  ))}
                  {(!numbers || numbers.length === 0) && (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No phone numbers purchased yet</p>
                    </div>
                  )}
                </div>
              )}

              <Link href="/number-management">
                <Button variant="outline" className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <AiOutlineEye className="h-4 w-4 mr-2" />
                  View All Numbers
                </Button>
              </Link>
            </CollapsibleCard>

          </div>

        {/* Purchase Number Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Purchase Phone Number</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={purchaseCountry}
                    onChange={(e) => setPurchaseCountry(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Area Code (optional)
                  </label>
                  <input
                    type="text"
                    value={purchaseAreaCode}
                    onChange={(e) => setPurchaseAreaCode(e.target.value)}
                    placeholder="e.g., 555"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePurchaseNumber}
                  disabled={isPurchasing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPurchasing ? "Purchasing..." : "Purchase Number"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default withAuth(Dashboard);
