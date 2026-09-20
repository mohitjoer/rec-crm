# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Multi-stage Dockerfile for Next.js SaaS Collection CRM
# ------------------------------------------------------------------------------

# 1. Base Dependencies Stage
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
RUN npm install

# 2. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 3. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache libc6-compat

# Create non-root system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application assets and dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start"]

