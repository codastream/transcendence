import gymnasium as gym
from gymnasium import spaces
import requests
import urllib3
import numpy as np
import os

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Number of game engine ticks to advance per action.
# The real game runs at 60 FPS; the AI receives WebSocket frames with some
# latency. FRAME_SKIP=4 means each training "step" covers ~66 ms of real time,
# which matches the observed round-trip lag and forces the model to learn to
# plan ahead rather than react to the previous frame.
FRAME_SKIP = 4


class PongEnv(gym.Env):
    metadata = {"render_modes": [], "render_fps": 60}

    def __init__(self, base_url=None, render_mode=None, verify_ssl=None):
        super().__init__()

        if base_url is None:
            base_url = os.getenv("GAME_SERVICE_URL", "http://localhost:8080/api/game")

        if verify_ssl is None:
            verify_ssl = os.getenv("GAME_SERVICE_VERIFY_SSL", "").lower() in ("1", "true", "yes")

        if "localhost" in base_url or "127.0.0.1" in base_url:
            verify_ssl = False

        self.base_url = base_url
        self.verify_ssl = verify_ssl
        self.render_mode = render_mode
        self.window = None
        self.clock = None
        self.width = 800
        self.height = 600

        # Observation: [ball_x, ball_y, vx, vy, left_paddle_y, right_paddle_y]
        # Matches the 6-feature vector the current best_model was trained on,
        # and now also mirrors what ai_player.py feeds the model at inference.
        # vx/vy give the model velocity context so it can anticipate ball direction.
        # All values are raw pixels — no normalisation.
        self.observation_space = spaces.Box(
            low=np.array([0, 0, -20, -20, 0, 0], dtype=np.float32),
            high=np.array([self.width, self.height, 20, 20, self.height, self.height], dtype=np.float32),
            dtype=np.float32
        )

        # Action space: 0 = stop, 1 = up, 2 = down
        self.action_space = spaces.Discrete(3)

        self._http = requests.Session()
        self._http.verify = self.verify_ssl

        # Last observation — used by SelfPlayEnv to compute opponent action
        self._last_obs = None

        self.session_id = self._create_session()
        print(f"[PongEnv] Session created: {self.session_id} (SSL verify={self.verify_ssl})")
        self.reset()

    def _create_session(self):
        try:
            resp = self._http.post(f"{self.base_url}/create-session", timeout=5)
            resp.raise_for_status()
            session_id = resp.json()["sessionId"]
            print(f"[PongEnv] Created session at {self.base_url}: {session_id}")
            return session_id
        except requests.exceptions.RequestException as e:
            print(f"[PongEnv] Error creating session: {e}")
            raise

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        try:
            resp = self._http.post(
                f"{self.base_url}/rl/reset",
                json={"sessionId": self.session_id},
                timeout=5
            )
            resp.raise_for_status()
            data = resp.json()
            if "state" not in data:
                raise KeyError(f"Expected 'state' in response, got: {list(data.keys())}")
            obs = self._convert_state(data["state"])
            self._last_obs = obs
            return obs, {}
        except requests.exceptions.RequestException as e:
            print(f"[PongEnv] Error resetting game: {e}")
            raise

    def step(self, action):
        action_map = {0: "stop", 1: "up", 2: "down"}
        obs = None
        reward = 0
        done = False

        # Advance FRAME_SKIP ticks, accumulate reward.
        for i in range(FRAME_SKIP):
            try:
                resp = self._http.post(
                    f"{self.base_url}/rl/step",
                    json={
                        "sessionId": self.session_id,
                        "action": action_map[action],
                        "paddle": "right"
                    },
                    timeout=5
                )
                resp.raise_for_status()
                data = resp.json()
                obs = self._convert_state(data["state"])
                reward += data.get("reward", 0)
                done = data.get("done", False)
                if done:
                    break
            except requests.exceptions.RequestException as e:
                print(f"[PongEnv] Error in step: {e}")
                raise

        self._last_obs = obs
        return obs, reward, done, False, {}

    def step_both(self, right_action, left_action):
        """Advance the game sending actions for BOTH paddles simultaneously.

        Used by SelfPlayEnv so the opponent (left paddle) and the learning
        agent (right paddle) act in the same tick.

        The game service /rl/step endpoint must accept an optional
        'leftAction' field alongside 'action' / 'paddle'.
        """
        action_map = {0: "stop", 1: "up", 2: "down"}
        obs = None
        reward = 0
        done = False

        for _ in range(FRAME_SKIP):
            try:
                resp = self._http.post(
                    f"{self.base_url}/rl/step",
                    json={
                        "sessionId": self.session_id,
                        "action": action_map[right_action],
                        "paddle": "right",
                        "leftAction": action_map[left_action],
                    },
                    timeout=5
                )
                resp.raise_for_status()
                data = resp.json()
                obs = self._convert_state(data["state"])
                reward += data.get("reward", 0)
                done = data.get("done", False)
                if done:
                    break
            except requests.exceptions.RequestException as e:
                print(f"[PongEnv] Error in step_both: {e}")
                raise

        self._last_obs = obs
        return obs, reward, done, False, {}

    def _convert_state(self, backend_state):
        """Convert backend game state to 6-feature observation vector.
        Mirrors _extract_observation() in ai_player.py exactly.
        """
        try:
            ball = backend_state["ball"]
            paddles = backend_state["paddles"]
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
            print(f"[PongEnv] Error converting state: {e}")
            print(f"[PongEnv] State: {backend_state}")
            raise

    def render(self):
        pass

    def close(self):
        if self.window is not None:
            import pygame
            pygame.quit()
            self.window = None
