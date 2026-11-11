# Build the site, then serve the finished files with a small Node server on port 8080.

# --- Stage 1: build (needs the dev tools: TypeScript and Vite) ---
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Fails with a clear message if any yellow placeholder is still in index.html.
RUN npm run build:release

# --- Stage 2: run (needs only the built files and server.mjs) ---
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY server.mjs ./
USER node
EXPOSE 8080
# server.mjs listens on the PORT variable that Cloud Run sets (8080).
CMD ["node", "server.mjs"]
