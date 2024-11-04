# Start with the same base image
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# Upgrade NPM
RUN npm install -g npm@10.9.0 --no-audit --no-fund

# Install global packages
RUN npm install --no-audit --no-fund --global \
    npm-check-updates

COPY ./startup.sh /
RUN chmod +x /startup.sh

# Copy bash profile, if you copy it directly
# you'll lose your colors :-(
COPY ./.profile /tmp/.profile
RUN cat /tmp/.profile >> /home/node/.bashrc && \
    cat /tmp/.profile >> /home/node/.zshrc && \
    rm /tmp/.profile
    
