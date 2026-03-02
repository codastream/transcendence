# ==========================
# Stage 1 — Builder
# ==========================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# 1) Manifests nécessaires au calcul du graphe workspace
# Copy ROOT workspace manifests
COPY package.json package-lock.json ./
# les manifests du service
COPY srcs/game/package.json ./srcs/game/package.json
# Copy shared core package files
COPY srcs/shared/core/package*.json ./srcs/shared/core/
COPY srcs/shared/core/tsconfig.json ./srcs/shared/core/tsconfig.json

# 2) Installation déterministe (workspaces)
# Objectif : limiter la taille des modules a copier a l'etape 2
# Si ne fonctionne pas (car npm a fait du hoising : remontee des packages communs a la racine), faire npm ci (plus lourd)
RUN npm ci --workspace=srcs/game --workspace=srcs/shared/core

# 3) Sources nécessaires au build
COPY srcs/game ./srcs/game
COPY srcs/shared/core/src ./srcs/shared/core/src

# 4) Build core puis game
RUN npm run build --workspace srcs/shared/core
RUN npm run build --workspace srcs/game


# ==========================
# Stage 2 — Runner
# ==========================
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy manifests (required for prune)
COPY package-lock.json ./package-lock.json
COPY srcs/game/package.json ./package.json

# Copy already compiled modules ()

COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force

# Copier le package core compilé
COPY --from=builder /app/srcs/shared/core/package.json ./node_modules/@transcendence/core/package.json
COPY --from=builder /app/srcs/shared/core/dist ./node_modules/@transcendence/core/dist

# 7) Artifacts runtime du service
COPY --from=builder /app/srcs/game/dist ./dist

EXPOSE 3003

CMD ["node", "dist/server.js"]

