# Production Deployment Script for Dashboard BI (Windows)

Write-Host "🚀 Starting Dashboard BI Production Deployment..." -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ Error: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create .env.production with your production configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Loading production configuration..." -ForegroundColor Blue

# Build and start services
Write-Host "🔨 Building and starting services..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Blue
$services = docker-compose -f docker-compose.prod.yml ps

if ($services -match "Up") {
    Write-Host "✅ Services are running successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Dashboard BI is now available at:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  API: http://localhost:80/api" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Default admin credentials:" -ForegroundColor Yellow
    Write-Host "  Email: admin@example.com" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Change the default admin password immediately!" -ForegroundColor Red
} else {
    Write-Host "❌ Some services failed to start. Check logs with:" -ForegroundColor Red
    Write-Host "docker-compose -f docker-compose.prod.yml logs" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
