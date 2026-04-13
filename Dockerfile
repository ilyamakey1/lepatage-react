# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (dev needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install PM2 and tsx globally
RUN npm install -g pm2 tsx

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S lepatage -u 1001

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/database ./database
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/public ./public

# Copy PM2 ecosystem and entrypoint (миграции перед стартом)
COPY ecosystem.config.js ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create necessary directories and set permissions
RUN mkdir -p /app/public/assets /app/logs /app/database /data
RUN chown -R lepatage:nodejs /app

# Switch to non-root user
USER lepatage

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["./docker-entrypoint.sh"]

