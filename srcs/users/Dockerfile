# ==========================
# Stage 1 — Builder
# ==========================

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ==========================
# Stage 2 — Production
# ==========================

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache wget \
    && addgroup -S appgroup \
    && adduser -S appuser -G appgroup

COPY package.json package-lock.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

USER appuser

CMD ["node", "dist/index.js"]
