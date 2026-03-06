import api from './api-client';

// ── API functions for game sessions AI ──────────────────────────────────────────

export async function createAiSession(): Promise<{ sessionId: string; wsUrl: string }> {
  const res = await api.post('/game/create-session', { gameMode: 'ai' });
  return res.data;
}

export async function joinAiToSession(sessionId: string): Promise<void> {
  await api.post('/pong-ai/join-game', { sessionId });
}
