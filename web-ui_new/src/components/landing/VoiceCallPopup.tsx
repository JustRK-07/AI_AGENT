"use client";

import { useEffect, useState, useRef } from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceCallPopupProps {
  isOpen: boolean;
  onClose: () => void;
  demoType?: string;  // For landing page demos
  agentId?: string;   // For agent testing from dashboard
}

interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
}

interface DemoInfo {
  title: string;
  description: string;
  greeting: string;
}

export default function VoiceCallPopup({
  isOpen,
  onClose,
  demoType,
  agentId,
}: VoiceCallPopupProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [demoInfo, setDemoInfo] = useState<DemoInfo>({
    title: "Loading...",
    description: "AI voice assistant",
    greeting: "Hello! How can I help you today?",
  });

  const roomRef = useRef<Room | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent info from API
  useEffect(() => {
    if (isOpen) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      
      // Mode 1: Agent testing (from dashboard)
      if (agentId) {
        fetch(`${apiUrl}/agents/${agentId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              const agent = data.data;
              setDemoInfo({
                title: agent.name || "AI Agent",
                description: agent.description || "Test your AI voice agent",
                greeting: agent.greeting || `Hello! I'm ${agent.name}. How can I help you today?`,
              });
            }
          })
          .catch((err) => {
            console.error("Failed to fetch agent info:", err);
          });
      }
      // Mode 2: Demo agent (from landing page)
      else if (demoType) {
        fetch(`${apiUrl}/demo-agents`)
          .then((res) => res.json())
          .then((data) => {
            const agent = data.data.find((a: any) => a.slug === demoType);
            if (agent) {
              setDemoInfo({
                title: agent.title,
                description: agent.description || "AI voice assistant",
                greeting: `Hello! I'm ${agent.name || agent.title}. How can I help you today?`,
              });
            }
          })
          .catch((err) => {
            console.error("Failed to fetch demo agent info:", err);
          });
      }
    }
  }, [isOpen, demoType, agentId]);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Connect to LiveKit room
  const connectToRoom = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Determine API endpoint based on mode
      const apiEndpoint = agentId 
        ? `/api/agents/${agentId}/test-call`  // Agent testing mode
        : '/api/landing/create-room';          // Demo mode
      
      const requestBody = agentId 
        ? { agentId }
        : { demoType };

      // Call API to create room
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to create ${agentId ? 'test' : 'demo'} room`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || `Failed to create ${agentId ? 'test' : 'demo'} room`);
      }

      const { roomName, token, livekitUrl } = data.data;

      // Create and connect to LiveKit room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log("✓ Connected to room");
        setIsConnected(true);
        setIsConnecting(false);

        // Add welcome message to transcript
        setTranscript((prev) => [
          ...prev,
          {
            speaker: "agent",
            text: demoInfo.greeting,
            timestamp: new Date(),
          },
        ]);
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log("✗ Disconnected from room");
        setIsConnected(false);
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        console.log(`✓ Track subscribed: ${track.kind} from ${participant.identity}`);

        if (track.kind === Track.Kind.Audio) {
          // Attach audio track to play
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();

          // Monitor audio levels for speaking detection
          publication.on('audioLevel', (level: number) => {
            setIsAgentSpeaking(level > 0.01); // Threshold for detecting speech
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        // Clean up audio elements
        track.detach().forEach((element) => element.remove());
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        // Track if agent is speaking
        const agentIsSpeaking = speakers.some(
          (speaker) => !speaker.identity.startsWith('user-')
        );
        setIsAgentSpeaking(agentIsSpeaking);

        // Track if user is speaking
        const userIsSpeaking = speakers.some(
          (speaker) => speaker.identity.startsWith('user-')
        );
        setIsUserSpeaking(userIsSpeaking);
      });

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));

          // Handle transcript data
          if (data.type === "transcript") {
            setTranscript((prev) => [
              ...prev,
              {
                speaker: data.speaker === "agent" ? "agent" : "user",
                text: data.text,
                timestamp: new Date(),
              },
            ]);
          }
        } catch (err) {
          console.error("Error parsing data:", err);
        }
      });

      // Listen for transcription segments (LiveKit's built-in transcription)
      room.on(RoomEvent.TranscriptionReceived, (segments, participant, publication) => {
        console.log("✓ Transcription received:", segments);

        segments.forEach((segment) => {
          if (segment.final && segment.text.trim()) {
            const speaker = participant?.identity.startsWith("user-") ? "user" : "agent";

            setTranscript((prev) => [
              ...prev,
              {
                speaker: speaker,
                text: segment.text,
                timestamp: new Date(),
              },
            ]);
          }
        });
      });

      // Listen for agent speech (track muted/unmuted events for agent activity)
      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && !participant.identity.startsWith("user-")) {
          setIsAgentSpeaking(false);
        }
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        if (publication.kind === Track.Kind.Audio && !participant.identity.startsWith("user-")) {
          setIsAgentSpeaking(true);
        }
      });

      // Connect to the room with WebSocket URL
      const wsUrl = livekitUrl.replace("https://", "wss://").replace("http://", "ws://");
      await room.connect(wsUrl, token);

      console.log(`✓ Joined room: ${roomName}`);

      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);

      // Trigger agent to join (optional - agent auto-joins via dispatch rule)
      fetch('/api/landing/trigger-agent', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomName, demoType }),
      }).catch((err) => console.error("Failed to trigger agent:", err));

    } catch (err) {
      console.error("Error connecting to room:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsConnecting(false);
    }
  };

  // Disconnect from room
  const disconnectFromRoom = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setTranscript([]);
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (roomRef.current) {
      const enabled = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(enabled);
      setIsMuted(!enabled);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (roomRef.current) {
      // Mute/unmute all remote audio tracks
      roomRef.current.remoteParticipants.forEach((participant) => {
        participant.audioTrackPublications.forEach((publication) => {
          if (publication.track) {
            publication.track.mediaStreamTrack.enabled = isSpeakerMuted;
          }
        });
      });
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };

  // Handle close
  const handleClose = async () => {
    await disconnectFromRoom();
    onClose();
  };

  // Auto-connect when opened
  useEffect(() => {
    if (isOpen && !isConnected && !isConnecting) {
      connectToRoom();
    }

    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-white rounded-3xl border-2 border-gray-200 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-[rgb(2,112,224)] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{demoInfo.title}</h2>
                  <p className="text-white/90 text-sm mt-1">
                    {demoInfo.description}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isConnecting && (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      <span className="text-sm">Connecting...</span>
                    </>
                  )}
                  {isConnected && (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm">Connected</span>
                    </>
                  )}
                  {error && (
                    <>
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-sm text-red-200">{error}</span>
                    </>
                  )}
                </div>

                {/* Voice Activity Indicator */}
                {isConnected && (
                  <div className="flex items-center gap-2">
                    {isAgentSpeaking && (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0ms' }} />
                          <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '16px', animationDelay: '150ms' }} />
                          <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '12px', animationDelay: '300ms' }} />
                          <div className="w-1 bg-white rounded-full animate-pulse" style={{ height: '8px', animationDelay: '450ms' }} />
                        </div>
                        <span className="text-xs ml-1">AI Speaking</span>
                      </div>
                    )}
                    {isUserSpeaking && !isAgentSpeaking && (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-1 bg-blue-300 rounded-full animate-pulse" style={{ height: '8px', animationDelay: '0ms' }} />
                          <div className="w-1 bg-blue-300 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '150ms' }} />
                          <div className="w-1 bg-blue-300 rounded-full animate-pulse" style={{ height: '16px', animationDelay: '300ms' }} />
                          <div className="w-1 bg-blue-300 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '450ms' }} />
                        </div>
                        <span className="text-xs ml-1">You're Speaking</span>
                      </div>
                    )}
                    {!isAgentSpeaking && !isUserSpeaking && (
                      <span className="text-xs text-white/70">🎧 Listening...</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Transcript */}
            <div className="p-6 h-96 overflow-y-auto bg-gray-50">
              {transcript.length === 0 && !error && (
                <div className="text-center text-gray-600 mt-20">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-30 text-gray-400" />
                  <p>Transcript will appear here once the conversation starts...</p>
                </div>
              )}

              {transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    entry.speaker === "agent" ? "text-left" : "text-right"
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] rounded-2xl px-4 py-2 ${
                      entry.speaker === "agent"
                        ? "bg-blue-50 border-2 border-[rgb(2,112,224)]"
                        : "bg-gray-200 border-2 border-gray-400"
                    }`}
                  >
                    <div className="text-xs text-gray-600 mb-1 font-medium">
                      {entry.speaker === "agent" ? "AI Agent" : "You"}
                    </div>
                    <div className="text-gray-900">{entry.text}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-gray-200">
              <div className="flex items-center justify-center gap-4">
                {/* Microphone */}
                <button
                  onClick={toggleMicrophone}
                  disabled={!isConnected}
                  className={`p-4 rounded-full transition-all ${
                    isMuted
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-[rgb(2,112,224)] hover:bg-[rgb(1,90,180)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Speaker */}
                <button
                  onClick={toggleSpeaker}
                  disabled={!isConnected}
                  className={`p-4 rounded-full transition-all ${
                    isSpeakerMuted
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-[rgb(2,112,224)] hover:bg-[rgb(1,90,180)]"
                  } disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
                  title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
                >
                  {isSpeakerMuted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Hang Up */}
                <button
                  onClick={handleClose}
                  disabled={!isConnected && !isConnecting}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="text-center text-gray-600 text-sm mt-4">
                {isConnected
                  ? "Speak naturally with the AI agent"
                  : "Connecting to AI agent..."}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
