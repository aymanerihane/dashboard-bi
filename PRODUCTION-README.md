# Dashboard BI - Production Deployment Guide

## 🚀 Quick Production Deployment

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 80, 443, and 3000 available

### 1. Configure Environment
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit production settings
nano .env.production
```

**IMPORTANT**: Change these security settings in `.env.production`:
- `DATABASE_PASSWORD`: Strong database password
- `JWT_SECRET`: Minimum 32 character random string

### 2. Deploy Application

**Linux/macOS:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

**Windows:**
```powershell
.\deploy-production.ps1
```

**Manual Deployment:**
```bash
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

### 3. Access Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost/api
- **Health Check**: http://localhost/health

### 4. Default Credentials
- **Email**: admin@example.com
- **Password**: admin123

⚠️ **CHANGE DEFAULT PASSWORD IMMEDIATELY**

## 🔧 Production Configuration

### Database Types Supported
- PostgreSQL
- MySQL
- MongoDB
- MongoDB Atlas
- Redis
- Cassandra
- SQLite

### Security Features
- JWT Authentication
- Rate Limiting (API: 10 req/s, Login: 5 req/m)
- Security Headers (XSS, CSRF protection)
- Password encryption
- No password storage for database connections

### Performance Features
- Nginx reverse proxy
- Docker multi-stage builds
- Next.js production optimization
- Static file serving
- Gzip compression

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx
```

### Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

## 🔒 SSL/HTTPS Setup (Optional)

### 1. Obtain SSL Certificate
```bash
# Using Let's Encrypt (recommended)
certbot certonly --standalone -d your-domain.com
```

### 2. Configure Nginx
Edit `nginx/nginx.conf` and uncomment the HTTPS server block.

### 3. Update Environment
```bash
# Add to .env.production
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

## 🛠 Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backup Database
```bash
# PostgreSQL backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres dashboard_prod > backup.sql
```

### Scale Services
```bash
# Scale frontend instances
docker-compose -f docker-compose.prod.yml up --scale frontend=3 -d
```

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :80
netstat -tulpn | grep :3000
```

**Memory Issues:**
```bash
# Check Docker memory usage
docker stats
```

**Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Health Checks
- Frontend: http://localhost:3000
- Backend: http://localhost/api/health
- Database: Check logs for connection errors

## 📞 Support

For issues or questions:
1. Check logs first
2. Review this documentation
3. Check GitHub issues
4. Create new issue with logs and configuration details

## 🎯 Production Checklist

- [ ] Changed default admin password
- [ ] Updated database password
- [ ] Set secure JWT secret
- [ ] Configured domain name (if applicable)
- [ ] Set up SSL certificate (recommended)
- [ ] Configured backup strategy
- [ ] Set up monitoring/alerting
- [ ] Tested database connections
- [ ] Verified all chart types work
- [ ] Tested drag & drop functionality
- [ ] Confirmed full chart view works
