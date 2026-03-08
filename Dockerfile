# Stage 1: Build the frontend
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# Stage 2: Serve with Node server
FROM node:22-slim AS production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.ts aiService.ts ./
COPY --from=build /app/dist ./dist

EXPOSE 8080

# Vertex AI credentials are passed via GOOGLE_SERVICE_ACCOUNT_JSON env var at runtime.
# Do NOT bake credentials into the image.
CMD ["npx", "tsx", "server.ts"]
