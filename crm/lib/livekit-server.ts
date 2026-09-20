import { AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';

export function getLiveKitClients() {
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  let livekitUrl = process.env.LIVEKIT_URL?.trim();

  if (!apiKey || !apiSecret || !livekitUrl) {
    throw new Error('LiveKit credentials are not properly configured');
  }

  // LiveKit server REST clients use http/https URLs
  if (livekitUrl.startsWith('wss://')) {
    livekitUrl = livekitUrl.replace('wss://', 'https://');
  } else if (livekitUrl.startsWith('ws://')) {
    livekitUrl = livekitUrl.replace('ws://', 'http://');
  }

  const agentDispatchClient = new AgentDispatchClient(livekitUrl, apiKey, apiSecret);
  const roomServiceClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

  return { agentDispatchClient, roomServiceClient, livekitUrl };
}
