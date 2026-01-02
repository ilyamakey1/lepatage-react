# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install PM2 globally
RUN npm install -g pm2

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S lepatage -u 1001

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/database ./database
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy PM2 ecosystem file
COPY ecosystem.config.js ./

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/logs
RUN chown -R lepatage:nodejs /app

# Switch to non-root user
USER lepatage

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]

