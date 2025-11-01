# syntax = docker/dockerfile:1

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-alpine AS base

LABEL fly_launch_runtime="Node.js Express + Vite SPA"

WORKDIR /app

# Set production environment
ENV NODE_ENV="production"

# Install pnpm
RUN npm install -g pnpm@10.14.0


# Build stage
FROM base AS build

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build both client and server
RUN pnpm run build


# Final production stage
FROM base

# Copy built application from builder
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the Node.js server
CMD ["node", "dist/server/node-build.mjs"]
