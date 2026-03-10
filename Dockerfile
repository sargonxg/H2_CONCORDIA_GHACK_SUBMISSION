# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the Next.js app and bundle the custom server
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js with standalone output
RUN npm run build

# Bundle the custom server (server.ts + lib/) into a single server.js
# Keep 'next' external — it's in standalone's node_modules
# Bundle ws and @google/genai into the output (pure JS, no native deps)
RUN npx esbuild server.ts \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile=.next/standalone/server.js \
    --external:next \
    --external:next/dist/server/lib/start-server

# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# Run our custom server (replaces Next.js's default standalone server.js)
CMD ["node", "server.js"]
