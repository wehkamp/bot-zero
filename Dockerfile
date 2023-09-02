FROM node:20-alpine as base

RUN echo "" \
  && echo "------------------------" \
  && echo "1/4 INSTALL DEPENDENCIES" \
  && echo "------------------------"

WORKDIR /bot-zero
COPY *.json ./

FROM base as build

RUN echo "" \
  && echo "--------------" \
  && echo "2/4 COPY FILES" \
  && echo "--------------"

COPY src ./src

RUN echo "" \
  && echo "-----------" \
  && echo "3/4 TESTING" \
  && echo "-----------" \
  && npm ci \
  && npm test \
  && npm run build

FROM base as final

COPY --from=build /bot-zero/dist ./dist

RUN echo "" \
  && echo "---------------" \
  && echo "4/4 FINAL IMAGE" \
  && echo "---------------"

ENV NODE_ENV=production
RUN npm ci --omit=dev

ENTRYPOINT ["npm", "start"]
