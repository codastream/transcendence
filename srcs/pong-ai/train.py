"""Train a PPO agent to play Pong using self-play.

The agent controls the RIGHT paddle. The LEFT paddle is controlled by a
frozen copy of the same model, updated every OPPONENT_UPDATE_FREQ steps.
Until a model exists the opponent acts randomly.

Usage:
    GAME_SERVICE_URL=https://localhost:3003 python3 train.py

The game service must be running with the rl/ endpoints active.
The trained model is saved to models/best_model.zip.

Note: the game service /rl/step endpoint must accept an optional
'leftAction' field for self-play to work. Without it, step_both() will
fall back gracefully (left paddle stays static server-side).
"""

import os
from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env
from stable_baselines3.common.callbacks import (
    EvalCallback,
    CheckpointCallback,
    CallbackList,
    BaseCallback,
)
from stable_baselines3.common.monitor import Monitor
from self_play_env import SelfPlayEnv
from pong_env import PongEnv

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
TOTAL_TIMESTEPS       = 1_000_000
EVAL_FREQ             = 10_000
N_EVAL_EPISODES       = 5
CHECKPOINT_FREQ       = 50_000
OPPONENT_UPDATE_FREQ  = 10_000   # copy model weights to opponent every N steps
MODEL_SAVE_PATH       = "models/best_model"
LOG_DIR               = "logs/"
CHECKPOINT_DIR        = "models/checkpoints/"

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(CHECKPOINT_DIR, exist_ok=True)
os.makedirs("models", exist_ok=True)


# ---------------------------------------------------------------------------
# Opponent update callback
# ---------------------------------------------------------------------------
class UpdateOpponentCallback(BaseCallback):
    """Copies the current model weights to the self-play opponent periodically."""

    def __init__(self, env: SelfPlayEnv, update_freq: int = 10_000, verbose: int = 0):
        super().__init__(verbose)
        self._sp_env = env
        self._update_freq = update_freq

    def _on_step(self) -> bool:
        if self.n_calls % self._update_freq == 0:
            self._sp_env.set_opponent(self.model)
            if self.verbose:
                print(f"[SelfPlay] Opponent updated at step {self.n_calls}")
        return True


# ---------------------------------------------------------------------------
# Environments
# ---------------------------------------------------------------------------
print("[train] Creating training environment (self-play)...")
train_sp_env = SelfPlayEnv()
train_env = Monitor(train_sp_env, LOG_DIR)

print("[train] Checking environment...")
check_env(train_env, warn=True)

print("[train] Creating eval environment...")
eval_env = Monitor(PongEnv(), LOG_DIR)

# ---------------------------------------------------------------------------
# Callbacks
# ---------------------------------------------------------------------------
opponent_callback = UpdateOpponentCallback(
    env=train_sp_env,
    update_freq=OPPONENT_UPDATE_FREQ,
    verbose=1,
)

eval_callback = EvalCallback(
    eval_env,
    best_model_save_path="models/",
    log_path=LOG_DIR,
    eval_freq=EVAL_FREQ,
    n_eval_episodes=N_EVAL_EPISODES,
    deterministic=True,
    render=False,
    verbose=1,
)

checkpoint_callback = CheckpointCallback(
    save_freq=CHECKPOINT_FREQ,
    save_path=CHECKPOINT_DIR,
    name_prefix="pong_checkpoint",
    verbose=1,
)

callbacks = CallbackList([opponent_callback, eval_callback, checkpoint_callback])

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
if os.path.exists(f"{MODEL_SAVE_PATH}.zip"):
    print(f"[train] Resuming from {MODEL_SAVE_PATH}.zip")
    model = PPO.load(
        MODEL_SAVE_PATH,
        env=train_env,
        verbose=1,
        tensorboard_log=LOG_DIR,
    )
else:
    print("[train] Starting fresh PPO model")
    model = PPO(
        "MlpPolicy",
        train_env,
        verbose=1,
        tensorboard_log=LOG_DIR,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,
        device="cuda",
    )

# ---------------------------------------------------------------------------
# Training
# ---------------------------------------------------------------------------
print(f"[train] Training for {TOTAL_TIMESTEPS:,} timesteps...")
model.learn(
    total_timesteps=TOTAL_TIMESTEPS,
    callback=callbacks,
    reset_num_timesteps=False,
    progress_bar=True,
)

model.save(MODEL_SAVE_PATH)
print(f"[train] Done. Model saved to {MODEL_SAVE_PATH}.zip")

train_env.close()
eval_env.close()
