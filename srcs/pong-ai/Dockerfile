# ─── Stage 1: builder ────────────────────────────────────────────────────────

FROM python:3.10-slim AS builder

RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --force-reinstall --upgrade "numpy<2" && \
    pip install --force-reinstall torch stable-baselines3

# ─── Stage 2: runtime ────────────────────────────────────────────────────────

FROM python:3.10-slim AS runtime

WORKDIR /app

COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY pong_server.py .
COPY ai_player.py .

RUN apt-get update && apt-get install -y wget curl && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /app/models/best_model

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health || exit 1

CMD ["uvicorn", "pong_server:app", "--host", "0.0.0.0", "--port", "3006", "--log-level", "info"]