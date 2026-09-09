# Multi-stage production Dockerfile for Enterprise Node.js Backend
FROM node:20-alpine AS base

WORKDIR /app

# Install build dependencies if native addons needed
RUN apk add --no-cache python3 make g++

FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production

FROM base AS release
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root system user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Ensure appuser owns application files and logs directory
RUN mkdir -p logs database && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

CMD ["node", "src/server.js"]
