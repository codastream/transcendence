import { useEffect } from 'react';

interface UseKeyboardControlsProps {
  wsRef: React.RefObject<WebSocket | null>;
  gameMode: string;
  playerRole?: 'A' | 'B' | null;
  enabled?: boolean; // Optional: to enable/disable controls
}

export const useKeyboardControls = ({
  wsRef,
  gameMode,
  playerRole = null,
  enabled = true,
}: UseKeyboardControlsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!wsRef.current) return;

      if (gameMode === 'local') {
        // local: W/S → left paddle, ArrowUp/Down → right paddle
        switch (event.key) {
          case 'w':
          case 'W':
            wsRef.current.send(JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'up' }));
            break;
          case 's':
          case 'S':
            wsRef.current.send(
              JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'down' }),
            );
            break;
          case 'ArrowUp':
            wsRef.current.send(
              JSON.stringify({ type: 'paddle', paddle: 'right', direction: 'up' }),
            );
            break;
          case 'ArrowDown':
            wsRef.current.send(
              JSON.stringify({ type: 'paddle', paddle: 'right', direction: 'down' }),
            );
            break;
        }
      } else if (gameMode === 'remote' || gameMode === 'tournament') {
        // Remote: only send commands for the paddle assigned to this client
        // Player A -> left paddle (W/S), Player B -> right paddle (ArrowUp/Down)
        if (!playerRole) return;
        if (playerRole === 'A') {
          switch (event.key) {
            case 'w':
            case 'W':
              wsRef.current?.send(
                JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'up' }),
              );
              break;
            case 's':
            case 'S':
              wsRef.current?.send(
                JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'down' }),
              );
              break;
          }
        } else if (playerRole === 'B') {
          switch (event.key) {
            case 'ArrowUp':
              wsRef.current?.send(
                JSON.stringify({ type: 'paddle', paddle: 'right', direction: 'up' }),
              );
              break;
            case 'ArrowDown':
              wsRef.current?.send(
                JSON.stringify({ type: 'paddle', paddle: 'right', direction: 'down' }),
              );
              break;
          }
        }
      } else if (gameMode === 'ai') {
        // AI mode: human controls the paddle assigned by their role (A=left, B=right)
        if (!playerRole) return;
        const paddle = playerRole === 'A' ? 'left' : 'right';
        switch (event.key) {
          case 'w':
          case 'W':
          case 'ArrowUp':
            event.preventDefault();
            if (event.repeat) break;
            wsRef.current.send(JSON.stringify({ type: 'paddle', paddle, direction: 'up' }));
            break;
          case 's':
          case 'S':
          case 'ArrowDown':
            event.preventDefault();
            if (event.repeat) break;
            wsRef.current.send(JSON.stringify({ type: 'paddle', paddle, direction: 'down' }));
            break;
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!wsRef.current) return;
      if (gameMode === 'local') {
        const keys = ['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'];
        if (keys.includes(event.key)) {
          wsRef.current.send(
            JSON.stringify({
              type: 'paddle',
              paddle: event.key === 'ArrowUp' || event.key === 'ArrowDown' ? 'right' : 'left',
              direction: 'stop',
            }),
          );
        }
      } else if (gameMode === 'remote' || gameMode === 'tournament') {
        if (!playerRole) return;
        // Envoyer stop uniquement au paddle que ce joueur contrôle
        const paddle = playerRole === 'A' ? 'left' : 'right';
        const keys = playerRole === 'A' ? ['w', 'W', 's', 'S'] : ['ArrowUp', 'ArrowDown'];
        if (keys.includes(event.key)) {
          wsRef.current.send(JSON.stringify({ type: 'paddle', paddle, direction: 'stop' }));
        }
      } else if (gameMode === 'ai') {
        if (!playerRole) return;
        const paddle = playerRole === 'A' ? 'left' : 'right';
        const keys = ['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'];
        if (keys.includes(event.key)) {
          wsRef.current.send(JSON.stringify({ type: 'paddle', paddle, direction: 'stop' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [wsRef, enabled, gameMode, playerRole]);
};
