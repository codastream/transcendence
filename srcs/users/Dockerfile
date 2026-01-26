# ==========================
# Stage 1 — Builder
# ==========================

# ==========================
# Paths should be written from root
# ==========================

FROM node:20-alpine AS builder

# needed for better-sqlite3
RUN apk add --no-cache python3 make g++
WORKDIR /app

# all package files to get necessary node modules
COPY package.json package-lock.json ./
COPY srcs/shared/core/package.json ./srcs/shared/core/package.json
COPY srcs/users/package.json ./srcs/users/package.json
RUN npm ci

COPY srcs/shared/core/src ./srcs/shared/core/src
COPY srcs/users/ ./srcs/users/

WORKDIR /app/srcs/users
RUN npx prisma generate
RUN npx vite build

WORKDIR /app
RUN npm prune --omit=dev

# ==========================
# Stage 2 — Production
# ==========================

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

WORKDIR /app/srcs/users
COPY --from=builder /app/srcs/users/package.json ./
COPY --from=builder /app/srcs/users/dist ./dist

COPY --from=builder /app/srcs/users/src/config/ ./src/config
COPY --from=builder /app/srcs/users/prisma ./prisma
COPY --from=builder /app/srcs/users/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/srcs/users/entrypoint.sh ./entrypoint.sh

# Skip husky in production
ENV HUSKY=0
ENV NODE_ENV=production

RUN chmod +x ./entrypoint.sh && mkdir -p /app/data /app/uploads

WORKDIR /app/srcs/users

ENTRYPOINT [ "./entrypoint.sh" ]

CMD ["node", "dist/index.js"]
