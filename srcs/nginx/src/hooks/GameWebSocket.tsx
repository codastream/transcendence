import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameState } from './GameState';
export const useGameWebSocket = () => {
  const websocketRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const startPingInterval = useCallback(() => {
    stopPingInterval();

    pingIntervalRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 10000);
  }, [stopPingInterval]);

  const closeWebSocket = useCallback(() => {
    stopPingInterval();

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Client closed');
      websocketRef.current = null;
    }

    setConnected(false);
  }, [stopPingInterval]);

  const openWebSocket = useCallback(
    (sessionId: string, onMessage: (msg: any) => void): Promise<WebSocket> => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        console.log('⚠️ WebSocket already open, returning existing connection');
        return Promise.resolve(websocketRef.current);
      }

      // Close existing socket if any
      closeWebSocket();

      return new Promise((resolve, reject) => {
        let settled = false;

        const wsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api/game/ws/${sessionId}`;
        console.log(wsUrl);

        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        const connectionTimeout = setTimeout(() => {
          if (!settled && ws.readyState !== WebSocket.OPEN) {
            // Don't reject if socket is already closing/closed (e.g. intentional cleanup)
            if (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED) {
              settled = true;
              return;
            }
            ws.close();
            settled = true;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

        ws.onopen = () => {
          console.log('WS OPEN at:', wsUrl);
          if (settled) return;
          settled = true;

          clearTimeout(connectionTimeout);
          setConnected(true);
          setError(null);
          startPingInterval();
          resolve(ws);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            onMessage(message);
          } catch (err) {
            console.error('Failed to parse message:', err);
          }
        };

        ws.onerror = () => {
          if (!settled) {
            settled = true;
            reject(new Error('WebSocket error'));
          }

          setConnected(false);
          setError('WebSocket error');
        };

        ws.onclose = (e) => {
          console.log('🔴 WebSocket closed', e.code, e.reason);
          clearTimeout(connectionTimeout);
          stopPingInterval();
          setConnected(false);
        };
      });
    },
    [closeWebSocket, startPingInterval, stopPingInterval],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closeWebSocket();
    };
  }, [closeWebSocket]);

  return {
    connected,
    error,
    openWebSocket,
    closeWebSocket,
  };
};
