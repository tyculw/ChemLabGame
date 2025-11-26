#!/bin/bash

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Setting up Nginx server...${NC}"

set -e # Exit on error

# Function to wait for apt lock
wait_for_lock() {
    echo "Checking for apt locks..."
    while fuser /var/lib/dpkg/lock >/dev/null 2>&1 || fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
        echo "Waiting for other apt process to finish..."
        sleep 5
    done
}

# 1. Install Nginx
echo "Installing Nginx..."
wait_for_lock
apt-get update
wait_for_lock
apt-get install -y nginx

# 2. Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/chemlabgame << 'EOF'
server {
    listen 80;
    server_name 115.190.205.0;

    root /var/www/chemlabgame;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

# 3. Enable site
echo "Enabling site..."
ln -sf /etc/nginx/sites-available/chemlabgame /etc/nginx/sites-enabled/
# Remove default site if it exists to avoid conflicts
rm -f /etc/nginx/sites-enabled/default

# 4. Set Permissions
echo "Setting permissions..."
# Ensure web directory exists (it should from deploy.sh)
mkdir -p /var/www/chemlabgame
# Set ownership to www-data (Nginx user)
chown -R www-data:www-data /var/www/chemlabgame
# Set permissions
chmod -R 755 /var/www/chemlabgame

# 5. Restart Nginx
echo "Restarting Nginx..."
# Check config first
nginx -t
if [ $? -eq 0 ]; then
    systemctl restart nginx
    echo -e "${GREEN}Server setup complete! Access your app at http://115.190.205.0${NC}"
else
    echo "Nginx configuration failed. Please check errors above."
    exit 1
fi
