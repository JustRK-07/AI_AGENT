import type { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

type ResponseData = {
  success: boolean;
  data?: {
    roomName: string;
    token: string;
    participantName: string;
    livekitUrl: string;
    agentId: string;
    expiresIn: number;
  };
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { agentId } = req.query;

    if (!agentId || typeof agentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
      });
    }

    // Fetch agent configuration from backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const agentResponse = await fetch(`${backendUrl}/api/v1/agents/${agentId}`);

    if (!agentResponse.ok) {
      throw new Error('Failed to fetch agent from backend');
    }

    const agentData = await agentResponse.json();
    const agent = agentData.data;

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent "${agentId}" not found`,
      });
    }

    // Get LiveKit credentials from environment
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_SERVER_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return res.status(500).json({
        success: false,
        error: 'LiveKit credentials not configured',
      });
    }

    // Create unique room name for testing
    const timestamp = Date.now();
    const roomName = `test-${agentId}-${timestamp}`;
    const participantName = `tester-${timestamp}`;

    // Create room using RoomServiceClient
    const roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    // Use the agent's LiveKit agent name from database
    const livekitAgentName = agent.livekitAgentName || `agent-${agentId}`;

    try {
      // Create the room with agent configuration from database
      await roomClient.createRoom({
        name: roomName,
        emptyTimeout: 900, // 15 minutes
        maxParticipants: 2, // Tester + AI agent
        // Tell LiveKit to dispatch the agent to this room
        agents: [
          {
            agentName: livekitAgentName,
            metadata: JSON.stringify({
              agentId: agentId,
              purpose: 'agent-testing',
              testMode: true,
              // Pass full agent configuration from database
              agentConfig: {
                id: agent.id,
                name: agent.name,
                description: agent.description,
                systemPrompt: agent.systemPrompt,
                greeting: agent.greeting,
                llmProvider: agent.llmProvider || 'openai',
                llmModel: agent.llmModel || 'gpt-4o-mini',
                voiceId: agent.voiceId || 'default',
                temperature: agent.temperature || 0.7,
                maxTokens: agent.maxTokens || 1000,
              },
            }),
          },
        ],
      });
      console.log(`✓ Created test room: ${roomName} for agent: ${agent.name} (${agentId})`);
      console.log(`✓ Agent config: ${agent.name} - ${agent.llmProvider}/${agent.llmModel}`);
    } catch (roomError: any) {
      // Room might already exist, which is fine
      console.log(`Room already exists or error creating: ${roomError.message}`);
    }

    // Generate participant token
    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      name: participantName,
    });

    // Grant permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    console.log(`✓ Generated test token for ${participantName} in room ${roomName}`);

    // Return room details and token
    return res.status(200).json({
      success: true,
      data: {
        roomName,
        token: jwt,
        participantName,
        livekitUrl: livekitUrl.replace('wss://', 'https://').replace('ws://', 'http://'),
        agentId,
        expiresIn: 900, // 15 minutes
      },
    });
  } catch (error: any) {
    console.error('Error creating test room:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create test room',
    });
  }
}

