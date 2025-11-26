#!/bin/bash

# Configuration
SERVER_USER="root"
SERVER_IP="115.190.205.0"
REMOTE_DIR="/var/www/chemlabgame"

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment process...${NC}"

# 1. Install Dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm install

# 2. Build the project
echo -e "${GREEN}Building the project...${NC}"
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful!${NC}"
else
    echo "Build failed. Exiting."
    exit 1
fi

# 3. Deploy to server
echo -e "${GREEN}Deploying to ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}...${NC}"

# Ensure remote directory exists
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Sync files using rsync
# -a: archive mode (preserves permissions, times, etc.)
# -v: verbose
# -z: compress during transfer
# --delete: delete extraneous files from dest dirs
rsync -avz --delete -e "ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no" dist/ $SERVER_USER@$SERVER_IP:$REMOTE_DIR

# 4. Run Setup Script Remotely
echo -e "${GREEN}Uploading and running setup script on remote server...${NC}"
scp -o PreferredAuthentications=password -o PubkeyAuthentication=no setup_server.sh $SERVER_USER@$SERVER_IP:/tmp/setup_server.sh
ssh -o PreferredAuthentications=password -o PubkeyAuthentication=no $SERVER_USER@$SERVER_IP "chmod +x /tmp/setup_server.sh && bash /tmp/setup_server.sh"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Deployment and Setup completed successfully!${NC}"
    echo -e "Visit http://$SERVER_IP to see your app."
else
    echo "Deployment failed."
    exit 1
fi
