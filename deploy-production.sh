#!/bin/bash

# Production Deployment Script for Dashboard BI

echo "🚀 Starting Dashboard BI Production Deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create .env.production with your production configuration."
    exit 1
fi

# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Production Configuration:"
echo "  - Database: $DATABASE_NAME"
echo "  - Frontend Port: $FRONTEND_PORT"
echo "  - HTTP Port: $HTTP_PORT"

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running successfully!"
    echo ""
    echo "🌐 Dashboard BI is now available at:"
    echo "  Frontend: http://localhost:$FRONTEND_PORT"
    echo "  API: http://localhost:$HTTP_PORT/api"
    echo ""
    echo "📝 Default admin credentials:"
    echo "  Email: admin@example.com"
    echo "  Password: admin123"
    echo ""
    echo "⚠️  IMPORTANT: Change the default admin password immediately!"
else
    echo "❌ Some services failed to start. Check logs with:"
    echo "docker-compose -f docker-compose.prod.yml logs"
fi

echo "🎉 Deployment complete!"
