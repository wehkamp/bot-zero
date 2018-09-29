#build using the latest node container
FROM node:latest AS buildstep

# Copy in package.json, install
# and build all node modules
WORKDIR /bot-zero
COPY package.json .
COPY package-lock.json .
RUN npm install --production

# This is our runtime container that will end up
# running on the device.
FROM node:alpine

# Set time zone on container
RUN apk add tzdata
ENV TZ=Europe/Amsterdam

WORKDIR /bot-zero

# Copy our node_modules into our deployable container context.
COPY --from=buildstep /bot-zero/node_modules node_modules
COPY bin ./bin
COPY package.json .
COPY package-lock.json .
COPY .env .
COPY scripts ./scripts
COPY index.js .
COPY external-scripts.json .

# Launch our App.
CMD ["npm", "start"]
