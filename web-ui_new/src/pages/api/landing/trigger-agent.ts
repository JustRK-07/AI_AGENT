import type { NextApiRequest, NextApiResponse } from 'next';
import { AccessToken } from 'livekit-server-sdk';

interface ResponseData {
  success: boolean;
  message?: string;
  data?: {
    roomName: string;
    agentToken: string;
    agentIdentity: string;
    note: string;
  };
  error?: string;
}

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
    const { roomName, demoType } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'Room name is required',
      });
    }

    // Get LiveKit credentials
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_SERVER_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return res.status(500).json({
        success: false,
        error: 'LiveKit credentials not configured',
      });
    }

    // Create agent token with special metadata
    const agentIdentity = `agent-${Date.now()}`;
    const token = new AccessToken(apiKey, apiSecret, {
      identity: agentIdentity,
      name: `AI Agent - ${demoType || 'Demo'}`,
      metadata: JSON.stringify({
        isAgent: true,
        demoType: demoType || 'general',
        roomName: roomName,
      }),
    });

    // Grant full permissions to agent
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    console.log(`✓ Generated agent token for room ${roomName}`);

    // Note: The demo_agents.py should be running and listening for rooms
    // For automatic joining, you can:
    // 1. Use LiveKit dispatch rules (recommended for production)
    // 2. Have the agent poll for rooms matching a pattern
    // 3. Use a webhook to trigger the agent

    return res.status(200).json({
      success: true,
      message: 'Agent token generated. Ensure demo_agents.py is running to join the room.',
      data: {
        roomName,
        agentToken: jwt,
        agentIdentity,
        note: 'The Python agent (demo_agents.py) should be running to automatically join demo rooms.',
      },
    });
  } catch (error: any) {
    console.error('Error triggering agent:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger agent',
    });
  }
}
