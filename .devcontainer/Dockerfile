# Start with the same base image
FROM mcr.microsoft.com/devcontainers/javascript-node:0-18-bullseye

# Upgrade NPM
RUN npm install -g npm@9.6.7

# Install global packages
RUN npm install --no-audit --no-fund --global \
    npm-check-updates

COPY ./startup.sh /
RUN chmod +x /startup.sh