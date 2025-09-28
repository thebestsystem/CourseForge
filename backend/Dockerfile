# Multi-stage build for optimized production image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with exact versions for reproducibility
RUN npm ci --only=production && npm cache clean --force

# Install dev dependencies for building
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 courseforge

# Copy built application
COPY --from=builder --chown=courseforge:nodejs /app/dist ./dist
COPY --from=builder --chown=courseforge:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=courseforge:nodejs /app/package.json ./package.json
COPY --from=builder --chown=courseforge:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p /app/logs && chown courseforge:nodejs /app/logs

# Switch to non-root user
USER courseforge

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]