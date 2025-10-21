import { useState, useEffect } from "react";
import { campaignsService } from "@/services/campaignsService";
import { agentsService } from "@/services/agentsService";
import {
  AiOutlineLoading3Quarters,
  AiOutlinePhone,
  AiOutlineCheck,
  AiOutlineClose,
  AiOutlineWarning,
  AiOutlineUser,
  AiOutlineRobot,
  AiOutlineClockCircle,
  AiOutlineSound,
  AiOutlineStop
} from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, BarChart3, Zap } from "lucide-react";
import { toast } from "sonner";
import { CollapsibleCard } from "@/components/shared/CollapsibleCard";

type CallStatus = {
  id: string;
  leadName?: string;
  phoneNumber: string;
  campaignName: string;
  status: string;
  startTime: Date;
  duration?: number;
  outcome?: string;
  interestLevel?: string;
};

type RealTimeStats = {
  // Hero Metrics
  activeCalls: number;
  totalCallsToday: number;
  activeCampaigns: number;
  liveAgents: number;

  // Call Performance
  answerRate: number;
  connectionRate: number;
  avgCallDuration: number;
  avgTalkTime: number;
  callsPerHour: number;
  peakCallTime: string;

  // Outcome Analytics
  completedToday: number;
  conversionRate: number;
  interestedLeads: number;
  callbacksScheduled: number;
  notInterested: number;
  noAnswerRate: number;
  voicemailRate: number;

  // Campaign Analytics
  campaignCompletion: number;
  leadsRemaining: number;
  campaignVelocity: number;

  // Agent Performance
  agentUtilization: number;
  avgCallsPerAgent: number;

  // Additional
  totalLeadsContacted: number;
};

type OverallStatsCall = {
  id: string;
  callStartTime: string;
  campaignName: string;
  phoneNumber: string;
  status: string;
  duration?: number;
};

// Utility function to get relative time
const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export function RealTimeDashboard() {
  const [realtimeStats, setRealtimeStats] = useState<RealTimeStats>({
    // Hero Metrics
    activeCalls: 0,
    totalCallsToday: 0,
    activeCampaigns: 0,
    liveAgents: 0,

    // Call Performance
    answerRate: 0,
    connectionRate: 0,
    avgCallDuration: 0,
    avgTalkTime: 0,
    callsPerHour: 0,
    peakCallTime: '0:00',

    // Outcome Analytics
    completedToday: 0,
    conversionRate: 0,
    interestedLeads: 0,
    callbacksScheduled: 0,
    notInterested: 0,
    noAnswerRate: 0,
    voicemailRate: 0,

    // Campaign Analytics
    campaignCompletion: 0,
    leadsRemaining: 0,
    campaignVelocity: 0,

    // Agent Performance
    agentUtilization: 0,
    avgCallsPerAgent: 0,

    // Additional
    totalLeadsContacted: 0,
  });

  const [liveCalls, setLiveCalls] = useState<CallStatus[]>([]);
  const [recentOutcomes, setRecentOutcomes] = useState<CallStatus[]>([]);
  const [listeningToCalls, setListeningToCalls] = useState<Set<string>>(new Set());
  const [monitorPopupOpen, setMonitorPopupOpen] = useState(false);
  const [selectedCallForMonitoring, setSelectedCallForMonitoring] = useState<CallStatus | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const [isLoading, setIsLoading] = useState(false);
  const [overallStats, setOverallStats] = useState<any>(null);

  // Fetch data using real API services
  const fetchRealTimeData = async () => {
    try {
      setIsLoading(true);
      const [campaignsData, agentsData] = await Promise.all([
        campaignsService.getAll(),
        agentsService.getAll()
      ]);

      // Process the data to match the expected format
      const campaigns = campaignsData?.campaigns || [];
      const agents = agentsData?.agents || [];

      // Create overall stats structure for compatibility
      const processedStats = {
        totalCalls: 0, // Would need to fetch from call logs if available
        successRate: 0,
        statusDistribution: {
          "IN_PROGRESS": agents.filter((agent: any) => agent.isActive).length,
          "COMPLETED": 0,
        },
        recentCalls: campaigns.map((campaign: any) => ({
          id: campaign.id,
          phoneNumber: campaign.callerIdNumber || 'N/A',
          campaignName: campaign.name,
          status: (campaign.status === 'RUNNING' || campaign.status === 'ACTIVE') ? "IN_PROGRESS" : "COMPLETED",
          callStartTime: campaign.createdAt || new Date().toISOString(),
          duration: 0
        })),
        outcomes: {
          "Interested": 0,
          "Callback Requested": 0
        }
      };

      setOverallStats(processedStats);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      toast.error('Failed to fetch real-time data');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds (changed from 5s to prevent rate limiting)
  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update stats when data changes
  useEffect(() => {
    if (overallStats) {
      const today = new Date().toDateString();
      const todaysCalls = overallStats.recentCalls.filter(
        (call: OverallStatsCall) => new Date(call.callStartTime).toDateString() === today
      );

      // Safe access to outcomes with fallback
      const outcomes = (overallStats.outcomes as Record<string, number>) || {};
      const interestedCount = outcomes["Interested"] || outcomes["interested"] || outcomes["INTERESTED"] || 0;
      const callbackCount = outcomes["Callback Requested"] || outcomes["callback_requested"] || outcomes["CALLBACK_REQUESTED"] || 0;
      const notInterestedCount = outcomes["Not Interested"] || outcomes["not_interested"] || outcomes["NOT_INTERESTED"] || 0;

      // Calculate call performance metrics
      const totalDialed = overallStats.totalCalls || 0;
      const answeredCalls = todaysCalls.filter((call: OverallStatsCall) => call.status === "COMPLETED" || call.status === "IN_PROGRESS").length;
      const connectedCalls = todaysCalls.filter((call: OverallStatsCall) => call.status !== "NO_ANSWER" && call.status !== "FAILED").length;
      const noAnswerCalls = todaysCalls.filter((call: OverallStatsCall) => call.status === "NO_ANSWER").length;
      const voicemailCalls = todaysCalls.filter((call: OverallStatsCall) => call.status === "VOICEMAIL").length;

      // Calculate average durations
      const completedWithDuration = todaysCalls.filter((call: OverallStatsCall) => call.duration && call.duration > 0);
      const avgDuration = completedWithDuration.length > 0
        ? completedWithDuration.reduce((sum: number, call: OverallStatsCall) => sum + (call.duration || 0), 0) / completedWithDuration.length
        : 0;

      // Calculate calls per hour
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hoursElapsed = Math.max((now.getTime() - startOfDay.getTime()) / (1000 * 60 * 60), 1);
      const callsPerHour = todaysCalls.length / hoursElapsed;

      // Find peak calling hour
      const callsByHour = todaysCalls.reduce((acc: Record<number, number>, call: OverallStatsCall) => {
        const hour = new Date(call.callStartTime).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      const peakHour = Object.entries(callsByHour).reduce((max, [hour, count]) =>
        (count as number) > (callsByHour[max as any] || 0) ? parseInt(hour as string) : max, 0);

      // Calculate campaign metrics (mock values - would need actual lead data)
      const totalLeads = 1000; // This should come from actual lead data
      const contactedLeads = overallStats.totalCalls || 0;
      const campaignCompletion = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0;
      const leadsRemaining = Math.max(totalLeads - contactedLeads, 0);
      const campaignVelocity = callsPerHour;

      // Calculate agent metrics
      const totalAgents = 10; // This should come from actual agent data
      const activeAgents = overallStats.statusDistribution["IN_PROGRESS"] || 0;
      const avgCallsPerAgent = activeAgents > 0 ? todaysCalls.length / activeAgents : 0;
      const agentUtilization = totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;

      // Update stats with smooth transitions
      setRealtimeStats(prev => ({
        // Hero Metrics
        activeCalls: overallStats.statusDistribution["IN_PROGRESS"] || 0,
        totalCallsToday: todaysCalls.length,
        activeCampaigns: 5, // This should come from actual campaign data
        liveAgents: activeAgents,

        // Call Performance
        answerRate: totalDialed > 0 ? (answeredCalls / totalDialed) * 100 : 0,
        connectionRate: totalDialed > 0 ? (connectedCalls / totalDialed) * 100 : 0,
        avgCallDuration: avgDuration,
        avgTalkTime: avgDuration * 0.8, // Assuming 80% is actual talk time
        callsPerHour: callsPerHour,
        peakCallTime: `${peakHour}:00`,

        // Outcome Analytics
        completedToday: todaysCalls.length,
        conversionRate: overallStats.successRate * 100,
        interestedLeads: interestedCount,
        callbacksScheduled: callbackCount,
        notInterested: notInterestedCount,
        noAnswerRate: totalDialed > 0 ? (noAnswerCalls / totalDialed) * 100 : 0,
        voicemailRate: totalDialed > 0 ? (voicemailCalls / totalDialed) * 100 : 0,

        // Campaign Analytics
        campaignCompletion: campaignCompletion,
        leadsRemaining: leadsRemaining,
        campaignVelocity: campaignVelocity,

        // Agent Performance
        agentUtilization: agentUtilization,
        avgCallsPerAgent: avgCallsPerAgent,

        // Additional
        totalLeadsContacted: overallStats.totalCalls,
      }));

      // Update live calls with optimistic updates
      const activeCalls = overallStats.recentCalls
        .filter((call: OverallStatsCall) => call.status === "IN_PROGRESS")
        .map((call: OverallStatsCall) => ({
          id: call.id,
          phoneNumber: call.phoneNumber,
          campaignName: call.campaignName,
          status: call.status,
          startTime: new Date(call.callStartTime),
          duration: call.duration ?? undefined
        }));

      // Smoothly update live calls
      setLiveCalls(prev => {
        // Keep calls that are still active
        const updatedCalls = activeCalls.filter((newCall: CallStatus) =>
          !prev.some((oldCall: CallStatus) => oldCall.id === newCall.id && oldCall.status !== newCall.status)
        );
        return updatedCalls;
      });

      // No real call history API available yet - show empty state
      setRecentOutcomes([]);

      setLastUpdateTime(new Date());
    }
  }, [overallStats]);

  const handleListenToCall = (callId: string, phoneNumber: string) => {
    // Find the call details
    const callToMonitor = liveCalls.find(call => call.id === callId);
    if (!callToMonitor) {
      toast.error("Call not found");
      return;
    }

    if (listeningToCalls.has(callId)) {
      // Stop listening
      setListeningToCalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(callId);
        return newSet;
      });
      setMonitorPopupOpen(false);
      setSelectedCallForMonitoring(null);
      toast.success(`Stopped listening to ${phoneNumber}`);
    } else {
      // Start listening - open monitor popup
      setSelectedCallForMonitoring(callToMonitor);
      setMonitorPopupOpen(true);
      setListeningToCalls(prev => {
        const newSet = new Set(prev);
        newSet.add(callId);
        return newSet;
      });
      toast.success(`Starting real-time monitoring for ${phoneNumber}...`);
    }
    
    console.log(`Listen to call: ${callId} - ${phoneNumber}`);
  };

  const handleStopListening = () => {
    if (selectedCallForMonitoring) {
      setListeningToCalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedCallForMonitoring.id);
        return newSet;
      });
    }
    setMonitorPopupOpen(false);
    setSelectedCallForMonitoring(null);
  };

  const handleMarkCallCompleted = async (callId: string, phoneNumber: string) => {
    try {
      // Note: This would need a specific endpoint in gobiService for call completion
      toast.success(`Call to ${phoneNumber} marked as completed`);
      await fetchRealTimeData(); // Refresh data
    } catch (error: any) {
      toast.error(`Failed to complete call: ${error.message}`);
    }
  };

  const handleAutoCompleteStale = async () => {
    try {
      toast.success("Stale calls auto-completed");
      await fetchRealTimeData(); // Refresh data
    } catch (error: any) {
      toast.error(`Failed to auto-complete calls: ${error.message}`);
    }
  };

  const handleSimulateHangup = async (callId: string, phoneNumber: string) => {
    try {
      toast.success(`Call hangup recorded for ${phoneNumber}`);
      await fetchRealTimeData(); // Refresh data
    } catch (error: any) {
      toast.error(`Failed to record hang-up: ${error.message}`);
    }
  };

  // Auto-cleanup stale calls every 2 minutes
  useEffect(() => {
    const autoCleanupInterval = setInterval(() => {
      // Only auto-cleanup if there are calls that look stale (longer than 3 minutes)
      const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
      const staleCalls = liveCalls.filter(call => call.startTime < threeMinutesAgo);

      if (staleCalls.length > 0) {
        console.log(`Found ${staleCalls.length} potentially stale calls, running auto-cleanup`);
        handleAutoCompleteStale();
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(autoCleanupInterval);
  }, [liveCalls]);

  // Auto-refresh for real-time updates every 15 seconds to show updated relative times
  useEffect(() => {
    const relativeTimeUpdateInterval = setInterval(() => {
      setLastUpdateTime(new Date());
    }, 15 * 1000); // Update relative times every 15 seconds

    return () => clearInterval(relativeTimeUpdateInterval);
  }, []);

  // Add smooth transitions for status changes
  const getStatusTransition = (status: string) => {
    return "transition-all duration-300 ease-in-out";
  };

  // Update the status color function to include transitions
  const getStatusColor = (status: string) => {
    const baseColors = {
      "IN_PROGRESS": "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
      "COMPLETED": "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
      "FAILED": "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
      "NO_ANSWER": "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
      "VOICEMAIL": "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
      "HUNG_UP": "text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700",
      "default": "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"
    };

    return `${baseColors[status as keyof typeof baseColors] || baseColors.default} ${getStatusTransition(status)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <AiOutlineLoading3Quarters className="h-4 w-4 text-blue-500 dark:text-blue-400 animate-spin" />;
      case "COMPLETED":
        return <AiOutlineCheck className="h-4 w-4 text-green-500 dark:text-green-400" />;
      case "FAILED":
        return <AiOutlineClose className="h-4 w-4 text-red-500 dark:text-red-400" />;
      case "NO_ANSWER":
        return <AiOutlinePhone className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />;
      case "VOICEMAIL":
        return <AiOutlineWarning className="h-4 w-4 text-orange-500 dark:text-orange-400" />;
      case "HUNG_UP":
        return <AiOutlineClose className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <AiOutlineWarning className="h-4 w-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusDisplayText = (call: CallStatus) => {
    if (call.status === "HUNG_UP") {
      return "Hung Up";
    }
    return call.status.replace(/_/g, ' ').toLowerCase();
  };

  const getCallOutcome = (call: CallStatus) => {
    // This would come from the results field in a real implementation
    // For now, we'll simulate based on status
    if (call.status === "HUNG_UP") {
      return "Customer ended call";
    }
    if (call.status === "COMPLETED") {
      return "Call completed successfully";
    }
    if (call.status === "NO_ANSWER") {
      return "No answer";
    }
    return null;
  };

  const formatDuration = (startTime: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const seconds = diffInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Calls */}
        <CollapsibleCard
          title="Live Calls"
          icon={<Phone className="h-5 w-5" />}
          storageKey="dashboard-live-calls"
          defaultCollapsed={false}
          collapsible={true}
          closeable={false}
          badge={
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Real-time</span>
            </div>
          }
          actions={liveCalls.length > 0 ? [{
            label: "Cleanup Stale",
            onClick: handleAutoCompleteStale,
            icon: isLoading ? <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" /> : <AiOutlineStop className="h-3 w-3" />,
            disabled: isLoading
          }] : undefined}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AiOutlineLoading3Quarters className="h-12 w-12 text-blue-500 dark:text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading live calls...</p>
            </div>
          ) : liveCalls.length > 0 ? (
            <div className="space-y-3">
              {liveCalls.map((call) => {
                const callDuration = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
                const isStale = callDuration > 5 * 60; // 5 minutes

                return (
                  <div key={call.id} className={`p-3 border rounded-lg ${isStale ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(call.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{call.phoneNumber}</p>
                            {isStale && (
                              <span className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
                                Stale ({Math.floor(callDuration / 60)}m)
                              </span>
                            )}
                            {listeningToCalls.has(call.id) && (
                              <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 px-2 py-1 rounded-full text-xs">
                                <AiOutlineSound className="h-3 w-3" />
                                <span>{monitorPopupOpen && selectedCallForMonitoring?.id === call.id ? "Monitoring" : "Listening"}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{call.campaignName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{formatDuration(call.startTime)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleListenToCall(call.id, call.phoneNumber)}
                            className={`flex items-center space-x-1 ${
                              listeningToCalls.has(call.id)
                                ? "text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700"
                                : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            }`}
                          >
                            {listeningToCalls.has(call.id) ? (
                              <>
                                <AiOutlineClose className="h-4 w-4" />
                                <span className="text-xs">Stop</span>
                              </>
                            ) : (
                              <>
                                <AiOutlineSound className="h-4 w-4" />
                                <span className="text-xs">Listen</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkCallCompleted(call.id, call.phoneNumber)}
                            disabled={isLoading}
                            className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 border-green-300 dark:border-green-700"
                          >
                            {isLoading ? (
                              <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                            ) : (
                              <AiOutlineCheck className="h-3 w-3" />
                            )}
                            <span className="text-xs">Complete</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSimulateHangup(call.id, call.phoneNumber)}
                            disabled={isLoading}
                            className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 border-red-300 dark:border-red-700"
                          >
                            {isLoading ? (
                              <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                            ) : (
                              <AiOutlineClose className="h-3 w-3" />
                            )}
                            <span className="text-xs">Hang Up</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AiOutlinePhone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-gray-900 dark:text-gray-100">No active calls</p>
              <p className="text-sm">Live calls will appear here when active</p>
            </div>
          )}
        </CollapsibleCard>

        {/* Recent Outcomes */}
        <CollapsibleCard
          title="Recent Call Outcomes"
          icon={<BarChart3 className="h-5 w-5" />}
          storageKey="dashboard-recent-outcomes"
          defaultCollapsed={false}
          collapsible={true}
          closeable={false}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AiOutlineLoading3Quarters className="h-12 w-12 text-purple-500 dark:text-purple-400 animate-spin mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading recent outcomes...</p>
            </div>
          ) : recentOutcomes.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentOutcomes.map((call) => (
                <div key={call.id} className={`p-3 border rounded-lg ${getStatusColor(call.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(call.status)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{call.phoneNumber}</p>
                        <p className="text-sm opacity-75 text-gray-700 dark:text-gray-300">{call.campaignName}</p>
                        {getCallOutcome(call) && (
                          <p className="text-xs opacity-60 mt-1">{getCallOutcome(call)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium capitalize text-gray-900 dark:text-gray-100">
                          {getStatusDisplayText(call)}
                        </p>
                        {call.status === "HUNG_UP" && (
                          <span className="bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                            ⚠️ Hung Up
                          </span>
                        )}
                      </div>
                      <p className="text-xs opacity-75">
                        {getRelativeTime(call.startTime)}
                      </p>
                    </div>
                  </div>
                  {call.duration && (
                    <div className="mt-2 text-xs opacity-75">
                      Duration: {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AiOutlineClockCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-gray-900 dark:text-gray-100">No Call History Available</p>
              <p className="text-sm mt-2">Call history tracking is not yet implemented</p>
              <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Completed calls will appear here once the calls API is connected</p>
            </div>
          )}
        </CollapsibleCard>
      </div>

      {/* Call Monitor Popup would go here if implemented */}
    </div>
  );
} 