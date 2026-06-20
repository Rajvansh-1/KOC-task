FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

# Install dependencies first
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --no-frozen-lockfile

# Copy frontend source and build
COPY frontend ./frontend
WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1
# Next.js standalone mode will be enabled in next.config.ts
RUN pnpm build

# ── Stage 2: Production ────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Next.js standalone output copies only necessary files
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "frontend/server.js"]
