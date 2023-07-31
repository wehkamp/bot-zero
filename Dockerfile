FROM node:18-alpine

WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .

RUN npm ci --omit=dev

COPY src ./src
COPY *.json .
COPY external-scripts.json ./dist/external-scripts.json

CMD ["npm", "start"]