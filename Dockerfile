# Stage 1: Install ALL dependencies (including dev for build)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js app + bundle custom server
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (no standalone mode — we use full node_modules)
RUN npm run build

# Bundle custom server.ts into server.compiled.js
# Keep 'next' external — we'll provide full node_modules
RUN npx esbuild server.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile=server.compiled.js \
    --external:next \
    --external:next/*

# Stage 3: Production dependencies only
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 4: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the FULL production node_modules (not standalone's minimal subset)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy the built Next.js app
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy package.json (needed by Next.js at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Copy next.config (needed by Next.js at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

# Copy public assets
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the bundled custom server
COPY --from=builder --chown=nextjs:nodejs /app/server.compiled.js ./server.js

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
