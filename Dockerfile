# ==============================================================================
# 1. DEPENDENCIES — install only what's needed to build
# ==============================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only lockfiles first so this layer is cached unless deps actually change
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Installs with whichever lockfile is present
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
  elif [ -f yarn.lock ]; then corepack enable yarn && yarn install --frozen-lockfile; \
  else npm install; \
  fi

# ==============================================================================
# 2. BUILDER — build the Next.js app
# ==============================================================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Needed if you use env vars at build time (e.g. NEXT_PUBLIC_*)
# ARG NEXT_PUBLIC_API_URL
# ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ==============================================================================
# 3. RUNNER — minimal production image
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Leverages Next.js's standalone output (requires next.config.js setting below)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]