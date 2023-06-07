#!/bin/sh

# config local GPG for signing
git config --global gpg.program gpg 

# install NPM packages
echo ""
echo "Installing packages..."
npm install --no-audit --no-fund

# copy example.env to .env
if [ ! -f .env ]; then
    echo ""
    echo "Copying .example.env to .env..."
    cp .example.env .env
fi

# colors
NC='\033[0m' # no color
BLUE='\033[1;34m'
YELLOW='\033[1;33m'

# echo start instructions
echo ""
echo ""
echo "${BLUE}To start your bot-zero instance, please enter: ${YELLOW}npm run dev${NC}"
echo ""