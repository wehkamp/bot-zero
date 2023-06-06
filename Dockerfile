FROM node:18-alpine AS buildstep

WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY src ./src
COPY tsconfig.json .

RUN npm run build


FROM node:18-alpine AS runtime

WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .

RUN npm ci --production

COPY external-scripts.json ./dist/external-scripts.json
COPY --from=buildstep /bot-zero/dist ./dist

CMD ["npm", "start"]