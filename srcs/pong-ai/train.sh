#!/bin/bash

# Training script for Pong AI
# Usage: ./train.sh [timesteps] [save_path]

TIMESTEPS=${1:-1000000}
SAVE_PATH=${2:-models/pong_strong}

echo "🎮 Starting Pong AI Training"
echo "📊 Total timesteps: $TIMESTEPS"
echo "💾 Save path: $SAVE_PATH"
echo "🎯 Target: Game service at http://game-service:3003"
echo ""

python3 /home/lisambet/Documents/forkedTranscendence/srcs/pong-ai/train_ppo.py \
    --timesteps $TIMESTEPS \
    --save-path $SAVE_PATH \
    --use-gpu

echo ""
echo "✅ Training complete!"
echo "📁 Model saved to: $SAVE_PATH"
