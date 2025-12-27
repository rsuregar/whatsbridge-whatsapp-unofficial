# Use Bun official image
FROM oven/bun:1 AS base

WORKDIR /app

# Add labels
LABEL maintainer="Farin Azis Chan <farinazischan@gmail.com>"
LABEL description="NotifWA API - Multi-session WhatsApp API Gateway with Baileys"
LABEL version="1.0.0"

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build stage (optional - Bun can run TypeScript directly, but we compile for smaller image)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compile TypeScript to JavaScript for production
RUN bun run build:ts || echo "Build skipped - Bun can run TypeScript directly"

# Production stage
FROM base AS runner

# Create non-root user for security
RUN addgroup -g 1001 -S notifwa && \
    adduser -S -D -H -u 1001 -G notifwa notifwa

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source files (Bun can run TypeScript directly)
COPY index.ts ./
COPY src ./src
COPY tsconfig.json ./

# Copy public files
COPY public ./public

# Create directories for sessions and media with proper permissions
RUN mkdir -p /app/sessions /app/public/media /app/store && \
    chown -R notifwa:notifwa /app

# Switch to non-root user
USER notifwa

# Expose port
EXPOSE 3000

# Health check (using curl which is available in Bun images)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the application with Bun (runs TypeScript directly)
CMD ["bun", "run", "index.ts"]
