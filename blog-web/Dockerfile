# Stage 1: Build WASM
# Use a specific Rust version for reproducibility
FROM rust:1.86.0 AS wasm-builder

WORKDIR /usr/src/app

# Install wasm-pack
# cargo install is slow, consider using a pre-built image with wasm-pack or installing from binary if speed is critical
RUN cargo install wasm-pack

# Copy wasm source code
# Only copy what's needed for the WASM build to leverage Docker cache
COPY ./md-wasm ./md-wasm

# Build the wasm package
# The output will be in ./md-wasm/pkg by default
RUN wasm-pack build ./md-wasm --target web

# Stage 2: Build Astro application
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and lock file
COPY package.json pnpm-lock.yaml ./

# Copy WASM build artifacts from wasm-builder stage to the public directory
# Astro will serve files from the public directory automatically.
# The WASM module can then be imported from /md-wasm-pkg/your_module_name.js
COPY --from=wasm-builder /usr/src/app/md-wasm/pkg ./public/md-wasm-pkg

# Install dependencies
RUN pnpm install

# Copy the rest of the application source code
COPY . .

# Build the Astro application
# The `build:wasm` script in package.json might be redundant now,
# or could be removed/modified if it conflicts.
# For now, we assume Astro's build will pick up the WASM from public.
RUN pnpm build

# Stage 3: Production image
FROM node:20-slim

WORKDIR /app

# 声明构建参数，接受 docker-compose 传入的 args
ARG PUBLIC_API_BASE_URL
ARG INTERNAL_API_BASE_URL

# 设置环境变量，供构建时读取
ENV PUBLIC_API_BASE_URL=$PUBLIC_API_BASE_URL
ENV INTERNAL_API_BASE_URL=$INTERNAL_API_BASE_URL

RUN npm install -g pnpm
# Copy built application from the builder stage
COPY --from=builder /app/dist /app/dist
# Copy package.json for running the app (Astro's node adapter might need it)
COPY --from=builder /app/package.json /app/

# Install production dependencies only
# Astro's standalone mode for the node adapter bundles dependencies,
# but following the original Dockerfile's pattern.
RUN pnpm install --prod

EXPOSE 4321

# Start the application
CMD ["node", "./dist/server/entry.mjs"]