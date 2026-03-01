# VPS Deployment Guide (Hostinger)

Simple deployment using only Docker on a single VPS. No external services needed.

## Prerequisites

- Hostinger VPS (Ubuntu 22.04 recommended)
- Domain name pointed to your VPS IP
- SSH access to your server

## Quick Deploy

### 1. Connect to your VPS

```bash
ssh root@your-vps-ip
```

### 2. Clone and Deploy

```bash
git clone <your-repo-url> /opt/store
cd /opt/store
chmod +x deploy.sh
sudo ./deploy.sh
```

This script will:
- Install Docker & Docker Compose
- Build all containers
- Start the application
- Run database migrations

### 3. Configure Environment

```bash
nano /opt/store/.env
```

Update these values:
```env
DB_PASSWORD=your_strong_password
JWT_SECRET=your_random_secret_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
ADMIN_PHONE=your_admin_phone
```

### 4. Restart with new config

```bash
cd /opt/store
docker-compose restart
```

## SSL Certificate (Let's Encrypt)

### Option 1: Using Certbot (Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is already configured in docker-compose.yml
```

### Option 2: Manual SSL

Place your certificates in:
```
/opt/store/nginx/ssl/
├── cert.pem
└── key.pem
```

Update `nginx/default.conf` to use them.

## Project Structure on VPS

```
/opt/store/
├── docker-compose.yml      # All services
├── .env                    # Environment variables
├── backend/                # Node.js API
├── frontend/               # Next.js app
├── nginx/                  # Nginx config
│   ├── nginx.conf
│   ├── default.conf
│   ├── app.conf
│   └── ssl.conf
└── uploads/                # Product images stored here
```

## Image Storage

Images are stored locally on the VPS:

- **Location**: `/opt/store/uploads/`
- **Access**: `https://yourdomain.com/uploads/filename.jpg`
- **Backup**: Include this folder in your backups

## Useful Commands

```bash
# View all logs
cd /opt/store && docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Restart services
docker-compose restart

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Database commands
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma studio

# Backup database
docker-compose exec postgres pg_dump -U store storedb > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U store storedb

# Update application (after git pull)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## Monitoring

Check container status:
```bash
docker-compose ps
docker stats
```

## Troubleshooting

### Port 80/443 already in use
```bash
# Check what's using the port
netstat -tulpn | grep :80

# Stop existing nginx/apache
systemctl stop nginx
systemctl stop apache2
```

### Database connection issues
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

### Container won't start
```bash
# Check logs
docker-compose logs service_name

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose up -d backend
```

## Security Checklist

- [ ] Change default DB_PASSWORD in .env
- [ ] Change JWT_SECRET to a random string
- [ ] Enable UFW firewall: `ufw allow 22,80,443/tcp`
- [ ] Setup SSL certificate
- [ ] Regular backups of `/opt/store/uploads/` and database
- [ ] Keep system updated: `apt update && apt upgrade -y`

## Updates

To update your application after code changes:

```bash
cd /opt/store
git pull origin main
docker-compose build --no-cache
docker-compose up -d
docker-compose exec backend npx prisma migrate deploy
```

## Costs

With Hostinger VPS:
- **VPS**: ~₹400-800/month (depending on plan)
- **Domain**: ~₹500-1000/year
- **SSL**: Free (Let's Encrypt)
- **Storage**: Included in VPS
- **Bandwidth**: Included in VPS

Total: ~₹500-1000/month for everything.
