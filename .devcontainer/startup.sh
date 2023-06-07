#!/bin/sh

# trust the repo
# fixes:
# - fatal: detected dubious ownership in repository at '/workspaces/bot-zero'.
git config --global --add safe.directory "$PWD"

# config local GPG for signing
# fixes:
# - error: cannot run C:\Program Files (x86)\Gpg4win..\GnuPG\bin\gpg.exe: No such file or directory.
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