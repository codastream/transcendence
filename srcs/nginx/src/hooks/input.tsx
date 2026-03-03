import { useEffect } from 'react';

interface UseKeyboardControlsProps {
  wsRef: React.RefObject<WebSocket | null>;
  gameMode: string;
  enabled?: boolean; // Optional: to enable/disable controls
}

export const useKeyboardControls = ({
  wsRef,
  gameMode,
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
      } else if (gameMode === 'ai') {
        // ai: W/S and ArrowUp/Down all control left paddle (right belongs to AI)
        switch (event.key) {
          case 'w':
          case 'W':
          case 'ArrowUp':
            event.preventDefault();
            if (event.repeat) break;
            wsRef.current.send(JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'up' }));
            break;
          case 's':
          case 'S':
          case 'ArrowDown':
            event.preventDefault();
            if (event.repeat) break;
            wsRef.current.send(
              JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'down' }),
            );
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
      } else if (gameMode === 'ai') {
        const keys = ['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'];
        if (keys.includes(event.key)) {
          wsRef.current.send(JSON.stringify({ type: 'paddle', paddle: 'left', direction: 'stop' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [wsRef, enabled, gameMode]);
};
