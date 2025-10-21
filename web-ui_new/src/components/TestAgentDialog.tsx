/**
 * Test Agent Dialog Component
 * Allows testing voice agent in real-time via browser
 */

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  MessageSquare,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Agent } from "@/services/agentsService";
import { toast } from "sonner";

interface TestAgentDialogProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface TranscriptMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

export function TestAgentDialog({ agent, isOpen, onClose }: TestAgentDialogProps) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Duration counter
  useEffect(() => {
    if (status === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [status]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStatus('disconnected');
      setTranscript([]);
      setDuration(0);
      setError(null);
      setIsMuted(false);
      setIsSpeakerMuted(false);
    }
  }, [isOpen]);

  const handleConnect = async () => {
    if (!agent) return;

    try {
      setStatus('connecting');
      setError(null);

      // TODO: Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // TODO: Call backend API to create test session
      // const response = await fetch(`/api/v1/agents/${agent.id}/test-session`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      // });
      // const { roomName, token } = await response.json();

      // TODO: Connect to LiveKit room
      // For now, simulate connection
      setTimeout(() => {
        setStatus('connected');
        toast.success(`Connected to ${agent.name}`);

        // Add welcome message
        addTranscriptMessage('agent', `Hello! I'm ${agent.name}. How can I help you today?`);
      }, 1500);

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect');
      setStatus('error');
      toast.error('Failed to connect to agent');
    }
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    toast.info('Disconnected from agent');

    // Add summary to transcript
    addTranscriptMessage('agent', `Thank you for testing! Call duration: ${formatDuration(duration)}`);
  };

  const addTranscriptMessage = (role: 'user' | 'agent', text: string) => {
    setTranscript(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        text,
        timestamp: new Date(),
      }
    ]);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerMuted(!isSpeakerMuted);
    toast.info(isSpeakerMuted ? 'Speaker unmuted' : 'Speaker muted');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connecting':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Connecting...
          </Badge>
        );
      case 'connected':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            Connected {formatDuration(duration)}
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
            Disconnected
          </Badge>
        );
    }
  };

  if (!agent) return null;

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
                <DialogTitle>Test Agent: {agent.name}</DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  {agent.description || 'Voice agent testing session'}
                </DialogDescription>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </DialogHeader>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Agent info */}
          <div className="flex-none px-6 py-3 bg-gray-50 border-b">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-600">Voice:</span>
                <span className="ml-2 font-medium">{agent.voiceId || 'default'}</span>
              </div>
              <div>
                <span className="text-gray-600">Personality:</span>
                <span className="ml-2 font-medium">{agent.personality || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Max Calls:</span>
                <span className="ml-2 font-medium">{agent.maxConcurrentCalls}</span>
              </div>
            </div>
          </div>

          {/* Transcript area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {transcript.length === 0 && status === 'disconnected' ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <MessageSquare className="h-12 w-12 mb-3" />
                <p className="text-sm font-medium">Ready to test</p>
                <p className="text-xs mt-1">Click "Start Test Call" to begin</p>
              </div>
            ) : (
              <>
                {transcript.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          {msg.role === 'user' ? 'You' : agent.name}
                        </span>
                        <span className="text-xs opacity-70">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex-none px-6 py-3 bg-red-50 border-t border-red-200">
              <div className="flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex-none px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status === 'connected' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleMute}
                      className={isMuted ? 'bg-red-50 border-red-300' : ''}
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4 text-red-600" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleSpeaker}
                      className={isSpeakerMuted ? 'bg-red-50 border-red-300' : ''}
                    >
                      {isSpeakerMuted ? (
                        <VolumeX className="h-4 w-4 text-red-600" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {status === 'disconnected' || status === 'error' || status === 'connecting' ? (
                  <Button
                    onClick={handleConnect}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={status === 'connecting'}
                  >
                    {status === 'connecting' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Start Test Call
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                  >
                    <PhoneOff className="h-4 w-4 mr-2" />
                    End Call
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
