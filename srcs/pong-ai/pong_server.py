from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Optional
import numpy as np
from datetime import datetime
from stable_baselines3 import PPO
from pong_env import PongEnv
import FastAPIRequest 



app = FastAPI(
    title="Pong AI Service",
    description="RL-agent for Pong via WebSocket",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GameSession:
    def __init__(self, session_id: str, model: PPO):
        self.session_id = session_id
        self.model = model
        self.env = PongEnv()
        self.obs, _ = self.env.reset()
        self.created_at = datetime.now()
        self.score_ai = 0
        self.score_player = 0
        self.game_over = False
    
    def get_ai_action(self) -> int:
        action, _states = self.model.predict(self.obs, deterministic=False)
        return int(action)
    
    def step(self, player_action: int) -> dict:
        ai_action = self.get_ai_action()
        
        if player_action == 1:
            self.env.player_paddle_y -= self.env.paddle_speed
        elif player_action == 2:
            self.env.player_paddle_y += self.env.paddle_speed
        
        self.env.player_paddle_y = np.clip(
            self.env.player_paddle_y, 
            0, 
            self.env.height - self.env.paddle_height
        )
        
        self.obs, reward, done, truncated, info = self.env.step(ai_action)
        
        if done or truncated:
            self.game_over = True
            self.score_ai = info["score_ai"]
            self.score_player = info["score_player"]
        
        return {
            "ball_x": float(self.env.ball_x),
            "ball_y": float(self.env.ball_y),
            "ball_vx": float(self.env.ball_vx),
            "ball_vy": float(self.env.ball_vy),
            "ai_paddle_y": float(self.env.ai_paddle_y),
            "player_paddle_y": float(self.env.player_paddle_y),
            "score_ai": self.score_ai,
            "score_player": self.score_player,
            "game_over": self.game_over,
            "reward": float(reward)
        }
    
    def reset(self):
        self.obs, _ = self.env.reset()
        self.score_ai = 0
        self.score_player = 0
        self.game_over = False
        
        return {
            "ball_x": float(self.env.ball_x),
            "ball_y": float(self.env.ball_y),
            "ball_vx": float(self.env.ball_vx),
            "ball_vy": float(self.env.ball_vy),
            "ai_paddle_y": float(self.env.ai_paddle_y),
            "player_paddle_y": float(self.env.player_paddle_y),
            "score_ai": 0,
            "score_player": 0,
            "game_over": False
        }


class AIService:
    def __init__(self, model_path: str = "models/pong_moderate/pong_moderate_final"):
        self.model_path = model_path
        self.model: Optional[PPO] = None
        self.sessions: Dict[str, GameSession] = {}
        self.load_model()
    
    def load_model(self):
        try:
            import os
            if os.path.exists(f"{self.model_path}.zip"):
                self.model = PPO.load(self.model_path)
                print(f"✅ Model loaded: {self.model_path}")
            else:
                print(f"⚠️  Model not found: {self.model_path}")
                print(f"⚠️  Will create new model on first training session")
                self.model = None
        except Exception as e:
            print(f"⚠️  Error loading model: {e}")
            self.model = None
    
    def create_session(self, session_id: str) -> GameSession:
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        session = GameSession(session_id, self.model)
        self.sessions[session_id] = session
        print(f"🎮 Created session: {session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[GameSession]:
        return self.sessions.get(session_id)
    
    def delete_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
            print(f"🗑️  Deleted session: {session_id}")
    
    def get_stats(self) -> dict:
        return {
            "active_sessions": len(self.sessions),
            "model_loaded": self.model is not None,
            "model_path": self.model_path
        }


ai_service = AIService()


@app.on_event("startup")
async def startup_event():
    print("🚀 Pong AI Service started")


@app.get("/invite-pong-ai")
async def invite(headers: dict):
    session_id = headers.get("session_id")
    uri = f"ws://game-service/{session_id}" 
   #async with connect(uri) as websocket:
    #    await websocket.send(json.dumps({"type": "start", "session_id": session_id}))
     #   response = await websocket.recv()
      #  print("Response from WebSocket server:", response)
    return {
        "service": "Pong AI",
        "version": "1.0.0",
        "status": response,
        "stats": ai_service.get_stats()
    }


@app.head("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": ai_service.model is not None
    }

@app.get("/health") 
async def health():
    return {
        "status": "healthy",
        "model_loaded": ai_service.model is not None
    }

@app.post("/session/create")
async def create_session(session_id: str):
    try:
        session = ai_service.create_session(session_id)
        state = session.reset()
        
        return {
            "status": "success",
            "session_id": session_id,
            "initial_state": state,
            "ws_url": f"/ws/game/{session_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/game/{session_id}")
async def websocket_game(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    session = ai_service.get_session(session_id)
    if not session:
        session = ai_service.create_session(session_id)
    
    try:
        initial_state = session.reset()
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "state": initial_state
        })
        
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "move":
                player_action = data.get("action", 0)
                state = session.step(player_action)
                
                await websocket.send_json({
                    "type": "state",
                    "data": state
                })
                
                if state["game_over"]:
                    await websocket.send_json({
                        "type": "game_over",
                        "winner": "AI" if state["score_ai"] > state["score_player"] else "Player",
                        "score_ai": state["score_ai"],
                        "score_player": state["score_player"]
                    })
            
            elif data.get("type") == "reset":
                state = session.reset()
                await websocket.send_json({
                    "type": "reset",
                    "state": state
                })
            
            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    
    except WebSocketDisconnect:
        print(f"🔌 Client disconnected: {session_id}")
        ai_service.delete_session(session_id)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        await websocket.close()
        ai_service.delete_session(session_id)


@app.get("/sessions")
async def list_sessions():
    return {
        "sessions": [
            {
                "session_id": sid,
                "created_at": session.created_at.isoformat(),
                "game_over": session.game_over,
                "score_ai": session.score_ai,
                "score_player": session.score_player
            }
            for sid, session in ai_service.sessions.items()
        ]
    }


@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    ai_service.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "pong_server:app",
        host="0.0.0.0",
        port=3006,
        reload=True,
        log_level="info"
    )
