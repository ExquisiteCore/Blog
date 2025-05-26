# Multi-stage build for Astro frontend with WASM

# Stage 1: Build WASM
FROM rust:1.86.0-slim AS wasm-builder

WORKDIR /usr/src/app

# Install system dependencies for wasm-pack
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Copy only WASM source code for better caching
COPY ./md-wasm ./md-wasm

# Build the wasm package
RUN wasm-pack build ./md-wasm --target web

# Stage 2: Dependencies stage
FROM node:20-alpine AS deps

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy WASM build artifacts
COPY --from=wasm-builder /usr/src/app/md-wasm/pkg ./public/md-wasm-pkg

# Copy source code
COPY . .

# Set build arguments
ARG PUBLIC_API_BASE_URL
ARG INTERNAL_API_BASE_URL
ARG NODE_ENV=production

# Set environment variables for build
ENV PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL
ENV INTERNAL_API_BASE_URL=$INTERNAL_API_BASE_URL
ENV NODE_ENV=$NODE_ENV

# Build the application
RUN pnpm build

# Stage 4: Production runtime
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S astro -u 1001

# Install pnpm
RUN npm install -g pnpm

# Copy built application
COPY --from=builder --chown=astro:nodejs /app/dist ./dist
COPY --from=builder --chown=astro:nodejs /app/package.json ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune && \
    npm cache clean --force

# Switch to non-root user
USER astro

EXPOSE 4321

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4321 || exit 1

# Start the application
CMD ["node", "./dist/server/entry.mjs"]