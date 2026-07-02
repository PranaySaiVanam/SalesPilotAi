# Production Dockerfile for SalesPilot AI Platform
# Multi-stage build for efficient node-based full-stack runtime on Cloud Run

# Stage 1: Build Frontend assets and Server bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Install package dependencies
COPY package.json ./
RUN npm install

# Copy application workspace files
COPY . .

# Compile application assets
RUN npm run build

# Stage 2: Minimalist container for production execution
FROM node:20-alpine AS runner

WORKDIR /app

# Injected runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy output bundles and requirements from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/src/types.ts ./src/

# Install tsx globally or locally for executing server.ts type-stripping
RUN npm install -g tsx && npm install express dotenv @google/genai

EXPOSE 3000

# Start production telemetry server
CMD ["tsx", "server.ts"]
