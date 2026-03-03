import asyncio
import json
import time
import numpy as np
import os
import ssl
from stable_baselines3 import PPO
import websockets
from typing import Optional


class AIPlayer:
    def __init__(self, model_path: str, game_service_url: str = None):
        self.model = PPO.load(model_path)

        if game_service_url is None:
            host = os.getenv("GAME_SERVICE_NAME", "game-service")
            port = os.getenv("GAME_SERVICE_PORT", "3003")
            game_service_url = f"wss://{host}:{port}"

        self.game_service_url = game_service_url

        self.ssl_context: ssl.SSLContext | None = None
        if self.game_service_url.startswith("wss://"):
            self.ssl_context = ssl.create_default_context()
            self.ssl_context.check_hostname = False
            self.ssl_context.verify_mode = ssl.CERT_NONE

        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.playing = False
        self.paddle = "right"

        self.max_retries = 2
        self.initial_delay = 1.0
        self.max_delay = 8.0

    async def connect(self, session_id: str):
        uri = f"{self.game_service_url}/ws/{session_id}"
        print(f"AI connecting to: {uri}", flush=True)
        try:
            self.websocket = await websockets.connect(uri, ssl=self.ssl_context)
            print(f"AI connected to session {session_id}", flush=True)
            return True
        except Exception as e:
            print(f"AI connection failed: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return False

    async def disconnect(self):
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            print("AI disconnected")

    def _extract_observation(self, game_state: dict) -> np.ndarray:
        try:
            ball = game_state["ball"]
            paddles = game_state["paddles"]
            left_paddle_y  = paddles["left"]["y"]  + paddles["left"]["height"]  / 2
            right_paddle_y = paddles["right"]["y"] + paddles["right"]["height"] / 2
            return np.array([
                ball["x"],
                ball["y"],
                ball.get("vx", 0),
                ball.get("vy", 0),
                left_paddle_y,
                right_paddle_y
            ], dtype=np.float32)
        except (KeyError, TypeError) as e:
            print(f"Error extracting observation: {e}", flush=True)
            return np.array([400, 300, 0, 0, 300, 300], dtype=np.float32)

    def _get_action(self, observation: np.ndarray) -> str:
        action, _ = self.model.predict(observation, deterministic=True)
        action_map = {0: "stop", 1: "up", 2: "down"}
        return action_map[int(action)]

    def _is_connected(self) -> bool:
        return self.websocket is not None and self.websocket.state.name == "OPEN"

    async def send_paddle_action(self, direction: str):
        if self._is_connected():
            await self.websocket.send(json.dumps({
                "type": "paddle",
                "paddle": self.paddle,
                "direction": direction
            }))

    async def play(self, session_id: str):
        print(f"AI play() called for session: {session_id}", flush=True)

        if not await self.connect(session_id):
            print(f"AI failed to connect, exiting play()", flush=True)
            return

        self.playing = True
        # Track last sent action so we can always send "stop" when transitioning
        # but don't suppress "up"/"down" — server needs them every frame to keep
        # moving (setPaddleDirection is stateful: it persists until overridden).
        last_sent_action = "stop"

        try:
            await self.websocket.send(json.dumps({"type": "ping"}))
            await self.websocket.send(json.dumps({"type": "start"}))
            print("AI player started, waiting for game state...", flush=True)

            while self.playing and self._is_connected():
                try:
                    message_str = await asyncio.wait_for(
                        self.websocket.recv(),
                        timeout=5.0
                    )
                    message = json.loads(message_str)

                    if message.get("type") == "state":
                        game_state = message.get("data", {})
                        status = game_state.get("status")

                        if status == "playing":
                            obs        = self._extract_observation(game_state)
                            new_action = self._get_action(obs)

                            # Always send the action — the server's paddle direction
                            # is persistent, so if we only send on change the paddle
                            # keeps drifting in whatever direction was last set.
                            # Exception: suppress duplicate "stop" to avoid noise.
                            if new_action != "stop" or last_sent_action != "stop":
                                await self.send_paddle_action(new_action)
                                last_sent_action = new_action

                        elif status == "finished":
                            scores = game_state.get("scores", {})
                            print(f"Game finished! Score: {scores.get('left', 0)} - {scores.get('right', 0)}", flush=True)
                            self.playing = False

                    elif message.get("type") == "gameOver":
                        print("Game over", flush=True)
                        self.playing = False

                    elif message.get("type") == "connected":
                        print(f"AI assigned paddle: {self.paddle}", flush=True)

                    elif message.get("type") == "pong":
                        pass  # keepalive ack, nothing to do

                    elif message.get("type") == "error":
                        print(f"Server error: {message.get('message')}", flush=True)
                        self.playing = False

                except asyncio.TimeoutError:
                    # 5s without a frame — send ping to keep connection alive
                    if self._is_connected():
                        await self.websocket.send(json.dumps({"type": "ping"}))

                except Exception as e:
                    print(f"Error in game loop: {e}", flush=True)
                    import traceback
                    traceback.print_exc()
                    break

        finally:
            await self.disconnect()
            print("AI player stopped")

    def stop(self):
        self.playing = False


async def join_game_as_ai(session_id: str, model_path: str = "models/best_model"):
    player = AIPlayer(model_path)
    await player.play(session_id)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python3 ai_player.py <session_id> [model_path]")
        sys.exit(1)

    session_id = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 else "models/best_model"

    print(f"Starting AI player for session: {session_id}")
    asyncio.run(join_game_as_ai(session_id, model_path))
