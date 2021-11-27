FROM node:16-alpine AS buildstep

WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .

RUN npm install

COPY src ./src
COPY tsconfig.json .

RUN npm run build


FROM node:16-alpine

WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .

RUN npm ci --production

COPY external-scripts.json ./dist/external-scripts.json
COPY bin ./bin
COPY --from=buildstep /bot-zero/dist ./dist

CMD ["npm", "start"]