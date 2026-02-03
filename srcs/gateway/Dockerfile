# ==========================
# Stage 1 — Builder
# ==========================

# ==========================
# Paths should be written from root
# ==========================

FROM node:20-alpine AS builder

WORKDIR /app

# 1. Copier UNIQUEMENT les manifests racine
COPY package.json package-lock.json ./

# les manisfest du service
COPY srcs/gateway/package.json ./srcs/gateway/package.json

# Copy shared core package files
COPY srcs/shared/core/package*.json ./srcs/shared/core/
COPY srcs/shared/core/tsconfig.json ./srcs/shared/core/tsconfig.json

# 2. Installation déterministe du monorepo
RUN npm ci

# 3. Copier tout le code
COPY srcs/gateway ./srcs/gateway
COPY srcs/shared/core/src ./srcs/shared/core/src

# 4. Build uniquement la gateway
RUN npm run build --workspace srcs/shared/core
RUN npm run build --workspace srcs/gateway

# ==========================
# Stage 2 — Production
# ==========================

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY srcs/gateway/package.json ./srcs/gateway/package.json
RUN npm ci --omit=dev --workspace srcs/gateway

# Créer le namespace
RUN mkdir -p node_modules/@transcendence
# Copier le package core compilé
COPY --from=builder /app/srcs/shared/core/package.json ./node_modules/@transcendence/core/package.json
COPY --from=builder /app/srcs/shared/core/dist ./node_modules/@transcendence/core/dist

# 5. Copier uniquement ce qui est nécessaire à la gateway
COPY --from=builder /app/srcs/gateway/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]

