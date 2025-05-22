FROM rust:1.86.0 AS builder

WORKDIR /usr/src/app
COPY . .

RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/target/release/backend /usr/src/app/backend
COPY --from=builder /usr/src/app/config.docker.toml /usr/src/app/config.toml

EXPOSE 8080

CMD ["./backend"]