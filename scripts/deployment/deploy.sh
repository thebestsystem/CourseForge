#!/bin/bash
set -e

# CourseForge Deployment Script
# Usage: ./deploy.sh [environment] [version]

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🚀 Starting CourseForge deployment..."
echo "Environment: ${ENVIRONMENT}"
echo "Version: ${VERSION}"

# Load environment-specific configuration
if [ -f "${PROJECT_ROOT}/.env.${ENVIRONMENT}" ]; then
    echo "📋 Loading environment configuration..."
    export $(cat "${PROJECT_ROOT}/.env.${ENVIRONMENT}" | grep -v '^#' | xargs)
else
    echo "⚠️ Warning: No environment file found for ${ENVIRONMENT}"
fi

# Function to check if service is healthy
check_health() {
    local service_url=$1
    local max_attempts=30
    local attempt=1

    echo "🔍 Checking health of ${service_url}..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${service_url}/health" > /dev/null; then
            echo "✅ Service is healthy!"
            return 0
        fi
        
        echo "⏳ Attempt ${attempt}/${max_attempts} - waiting for service..."
        sleep 10
        ((attempt++))
    done
    
    echo "❌ Service health check failed after ${max_attempts} attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    echo "📊 Running database migrations..."
    
    docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Database migrations completed successfully"
    else
        echo "❌ Database migrations failed"
        return 1
    fi
}

# Function to seed AI agents
seed_ai_agents() {
    echo "🤖 Seeding AI agents..."
    
    docker-compose -f docker-compose.prod.yml exec -T backend npm run db:seed
    
    if [ $? -eq 0 ]; then
        echo "✅ AI agents seeded successfully"
    else
        echo "⚠️ AI agents seeding failed (non-critical)"
    fi
}

# Function to backup database
backup_database() {
    if [ "${ENVIRONMENT}" = "production" ]; then
        echo "💾 Creating database backup..."
        
        BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
            -U ${POSTGRES_USER:-courseforge} \
            -d ${POSTGRES_DB:-courseforge} > "${PROJECT_ROOT}/backups/${BACKUP_FILE}"
        
        if [ $? -eq 0 ]; then
            echo "✅ Database backup created: ${BACKUP_FILE}"
        else
            echo "⚠️ Database backup failed"
        fi
    fi
}

# Function to deploy services
deploy_services() {
    echo "🐳 Deploying services with Docker Compose..."
    
    cd "${PROJECT_ROOT}"
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d --remove-orphans
    
    if [ $? -eq 0 ]; then
        echo "✅ Services started successfully"
    else
        echo "❌ Service deployment failed"
        return 1
    fi
}

# Function to cleanup old images
cleanup_images() {
    echo "🧹 Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images --format "table {{.Repository}}:{{.Tag}}" | \
        grep "courseforge" | \
        tail -n +4 | \
        xargs -r docker rmi
    
    echo "✅ Image cleanup completed"
}

# Main deployment flow
main() {
    echo "🎯 Starting deployment process..."
    
    # Create necessary directories
    mkdir -p "${PROJECT_ROOT}/backups"
    mkdir -p "${PROJECT_ROOT}/logs"
    
    # Backup database (production only)
    if [ "${ENVIRONMENT}" = "production" ]; then
        backup_database
    fi
    
    # Deploy services
    deploy_services
    
    # Wait for services to be ready
    echo "⏳ Waiting for services to be ready..."
    sleep 30
    
    # Check backend health
    check_health "${BACKEND_URL:-http://localhost:3001}"
    
    # Run migrations
    run_migrations
    
    # Seed AI agents
    seed_ai_agents
    
    # Check frontend health
    check_health "${FRONTEND_URL:-http://localhost:3000}"
    
    # Cleanup old images
    cleanup_images
    
    echo "🎉 Deployment completed successfully!"
    echo "📊 Backend: ${BACKEND_URL:-http://localhost:3001}"
    echo "🌐 Frontend: ${FRONTEND_URL:-http://localhost:3000}"
}

# Run deployment
main

# Exit with success
exit 0