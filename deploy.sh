#!/bin/bash

# E-Commerce Store Deployment Script for Hostinger VPS
# This script deploys the entire application to a single VPS using Docker

set -e

echo "🚀 Starting deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker $SUDO_USER
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
APP_DIR="/opt/store"
echo -e "${YELLOW}Setting up application directory at $APP_DIR...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/nginx

# Copy application files
echo -e "${YELLOW}Copying application files...${NC}"
cp -r backend $APP_DIR/
cp -r frontend $APP_DIR/
cp docker-compose.yml $APP_DIR/
cp -r nginx/* $APP_DIR/nginx/

# Create .env file if not exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example $APP_DIR/.env
    echo -e "${RED}⚠️  Please edit $APP_DIR/.env with your actual values before starting!${NC}"
fi

# Set permissions
chown -R $SUDO_USER:$SUDO_USER $APP_DIR
chmod 755 $APP_DIR/uploads

cd $APP_DIR

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database...${NC}"
sleep 10

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec -T backend npx prisma migrate deploy

# Seed database (optional - only on first deploy)
# docker-compose exec -T backend npx prisma db seed

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}Your store should be accessible at:${NC}"
echo -e "  HTTP:  http://$(curl -s ifconfig.me)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Edit $APP_DIR/.env with your production values"
echo "2. Configure your domain DNS to point to this server"
echo "3. Run: sudo certbot --nginx -d yourdomain.com (for SSL)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f"
echo "  Restart:      docker-compose restart"
echo "  Update:       docker-compose pull && docker-compose up -d"
