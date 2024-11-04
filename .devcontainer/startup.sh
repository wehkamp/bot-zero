#!/bin/sh

set -e

# trust the repo
# fixes:
# - fatal:   detected dubious ownership in repository at '/workspaces/bot-zero'.
# - warning: safe.directory 'C:/{...}/blaze-platform-provisioning' not absolute
git config --global --unset-all safe.directory > /dev/null 2>&1
git config --global --add safe.directory "$PWD"

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
