
# Start with the same base image
FROM mcr.microsoft.com/devcontainers/javascript-node:0-18-bullseye

# Install the npm packages globally
RUN npm install -g npm@9.6.7 \
    && npm install -g npm-check-updates

COPY ./config.sh /
RUN chmod +x /config.sh