
# Start with the same base image
FROM mcr.microsoft.com/devcontainers/javascript-node:0-18-bullseye

# Install GPG
RUN apt-get update && apt-get install gnupg2 -y

# Install the npm packages globally
RUN npm install -g npm@9.6.7
RUN npm install -g npm-check-updates