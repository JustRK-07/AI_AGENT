/**
 * Call Details Dialog Component
 * Shows detailed information about a specific call
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  User,
  Clock,
  Calendar,
  Building,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Mic,
  Play,
  RefreshCw,
} from "lucide-react";
import { getCallLogDetails, type CallLog } from "@/services/analyticsService";
import { toast } from "sonner";

interface CallDetailsDialogProps {
  callId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CallDetailsDialog({ callId, isOpen, onClose }: CallDetailsDialogProps) {
  const [callLog, setCallLog] = useState<CallLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && callId) {
      fetchCallDetails();
    }
  }, [isOpen, callId]);

  const fetchCallDetails = async () => {
    if (!callId) return;

    try {
      setIsLoading(true);
      const response = await getCallLogDetails(callId);
      setCallLog(response.data);
    } catch (error: any) {
      console.error('Error fetching call details:', error);
      toast.error('Failed to load call details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'answered':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'failed':
      case 'busy':
      case 'canceled':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'no-answer':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'in-progress':
      case 'ringing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'answered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
      case 'busy':
      case 'canceled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (!callId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-none px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Call Details</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  {callLog?.phoneNumber || 'Loading...'}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchCallDetails}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* Call Details */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : callLog ? (
            <div className="space-y-6">
              {/* Status and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(callLog.status)}>
                      {getStatusIcon(callLog.status)}
                      <span className="ml-1">{callLog.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Duration</label>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatDuration(callLog.duration)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{callLog.phoneNumber}</span>
                  </div>
                  {callLog.lead?.name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{callLog.lead.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Information */}
              {callLog.agent && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Agent Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{callLog.agent.name}</span>
                    </div>
                    {callLog.agent.voiceId && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mic className="h-4 w-4 text-gray-400" />
                        <span>Voice: {callLog.agent.voiceId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Campaign Information */}
              {callLog.campaign && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Campaign</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{callLog.campaign.name}</span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Timestamps</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Created:</span>
                    <span>{formatDate(callLog.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">Updated:</span>
                    <span>{formatDate(callLog.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Recording */}
              {callLog.recordingUrl && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recording</h3>
                  <Button variant="outline" size="sm" asChild>
                    <a href={callLog.recordingUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="h-4 w-4 mr-2" />
                      Play Recording
                    </a>
                  </Button>
                </div>
              )}

              {/* Error */}
              {callLog.error && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-red-700 mb-3">Error</h3>
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    {callLog.error}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {callLog.metadata && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Metadata</h3>
                  <pre className="bg-gray-50 rounded p-3 text-xs overflow-x-auto">
                    {JSON.stringify(callLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <AlertCircle className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">Call details not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none flex justify-end px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
