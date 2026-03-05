"""Self-play wrapper for PongEnv.

The agent always controls the RIGHT paddle.
The LEFT paddle is controlled by a frozen copy of the same model,
updated periodically via UpdateOpponentCallback in train.py.

Until a model is available the opponent acts randomly.
"""

import numpy as np
import gymnasium as gym
from pong_env import PongEnv


class SelfPlayEnv(gym.Env):
    metadata = {"render_modes": [], "render_fps": 60}

    def __init__(self, opponent_model=None, **env_kwargs):
        super().__init__()
        self.env = PongEnv(**env_kwargs)
        self.observation_space = self.env.observation_space
        self.action_space = self.env.action_space
        self.opponent_model = opponent_model  # None → random opponent

    def set_opponent(self, model):
        """Replace the frozen opponent policy (called by UpdateOpponentCallback)."""
        self.opponent_model = model

    def _get_opponent_obs(self, obs):
        """Mirror the observation for the left paddle perspective.

        The agent's obs is [ball_x, ball_y, vx, vy, left_y, right_y].
        From the left paddle's point of view:
          - ball_x is flipped  (width - ball_x)
          - vx is negated      (moving toward left = positive from left's pov)
          - paddle roles swap  (left_y ↔ right_y)
        """
        width = self.env.width
        ball_x, ball_y, vx, vy, left_y, right_y = obs
        return np.array(
            [width - ball_x, ball_y, -vx, vy, right_y, left_y],
            dtype=np.float32,
        )

    def reset(self, **kwargs):
        obs, info = self.env.reset(**kwargs)
        self.env._last_obs = obs
        return obs, info

    def step(self, action):
        # Compute opponent (left paddle) action from mirrored observation
        last_obs = getattr(self.env, "_last_obs", None)
        if self.opponent_model is not None and last_obs is not None:
            opp_obs = self._get_opponent_obs(last_obs)
            opp_action, _ = self.opponent_model.predict(opp_obs, deterministic=False)
            opp_action = int(opp_action)
        else:
            opp_action = self.env.action_space.sample()

        obs, reward, terminated, truncated, info = self.env.step_both(
            right_action=action,
            left_action=opp_action,
        )
        self.env._last_obs = obs
        return obs, reward, terminated, truncated, info

    def render(self):
        return self.env.render()

    def close(self):
        self.env.close()
