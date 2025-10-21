/**
 * Prompt History Dialog Component
 * Shows version history of agent prompts
 */

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  X,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  FileText,
  Mic,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Agent } from "@/services/agentsService";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface PromptHistoryDialogProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PromptHistory {
  id: string;
  agentId: string;
  version: number;
  systemPrompt: string | null;
  personality: string | null;
  voiceId: string | null;
  userId: string | null;
  userEmail: string | null;
  changeNote: string | null;
  createdAt: string;
}

export function PromptHistoryDialog({ agent, isOpen, onClose }: PromptHistoryDialogProps) {
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && agent) {
      fetchHistory();
    }
  }, [isOpen, agent]);

  const fetchHistory = async () => {
    if (!agent) return;

    try {
      setIsLoading(true);
      const response = await apiClient.get<{
        success: boolean;
        data: PromptHistory[];
      }>(`/agents/${agent.id}/prompt-history`);

      setHistory(response.data || []);
    } catch (error: any) {
      console.error('Error fetching prompt history:', error);
      toast.error('Failed to load prompt history');
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
    });
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const toggleExpand = (version: number) => {
    setExpandedVersion(expandedVersion === version ? null : version);
  };

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-none px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <History className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle>Prompt Version History</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  {agent.name} - {history.length} version{history.length !== 1 ? 's' : ''}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </DialogHeader>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <History className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium">No version history yet</p>
              <p className="text-xs mt-1">
                History will be saved when you edit the agent's prompt
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((version, index) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
                >
                  {/* Version Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpand(version.version)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-2">
                        {expandedVersion === version.version ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <Badge
                          variant="outline"
                          className={
                            index === 0
                              ? 'bg-purple-100 text-purple-700 border-purple-300'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          v{version.version}
                          {index === 0 && ' (Current)'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{getTimeAgo(version.createdAt)}</span>
                      </div>

                      {version.userEmail && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{version.userEmail}</span>
                        </div>
                      )}
                    </div>

                    {version.voiceId && (
                      <Badge variant="outline" className="text-xs">
                        <Mic className="h-3 w-3 mr-1" />
                        {version.voiceId}
                      </Badge>
                    )}
                  </div>

                  {/* Version Details (Expanded) */}
                  {expandedVersion === version.version && (
                    <div className="p-4 space-y-4 bg-white">
                      {/* System Prompt */}
                      {version.systemPrompt && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              System Prompt
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded p-3 text-sm text-gray-800 whitespace-pre-wrap">
                            {version.systemPrompt}
                          </div>
                        </div>
                      )}

                      {/* Personality */}
                      {version.personality && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Personality
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded p-3 text-sm text-gray-800">
                            {version.personality}
                          </div>
                        </div>
                      )}

                      {/* Voice ID */}
                      {version.voiceId && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mic className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              Voice ID
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded p-3 text-sm text-gray-800">
                            {version.voiceId}
                          </div>
                        </div>
                      )}

                      {/* Change Note */}
                      {version.changeNote && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500 italic">
                            Note: {version.changeNote}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(version.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
