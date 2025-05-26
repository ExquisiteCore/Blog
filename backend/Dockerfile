# Multi-stage build for Rust backend
FROM rust:1.86.0-slim AS chef
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Build dependencies - this layer is cached
RUN cargo chef cook --release --recipe-path recipe.json

# Copy source code and build application
COPY . .
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r bloguser && useradd -r -g bloguser bloguser

WORKDIR /app

# Copy binary and config
COPY --from=builder /app/target/release/backend /app/backend
COPY --from=builder /app/config.docker.toml /app/config.toml

# Set ownership
RUN chown -R bloguser:bloguser /app
USER bloguser

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./backend"]

# Production optimized stage
FROM runtime AS production
ENV RUST_LOG=info
ENV RUST_BACKTRACE=0