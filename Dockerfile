ARG node_version=16.14-alpine3.15

FROM node:${node_version} as base

RUN mkdir /opt/epp
# this expects a volume to be mounted to /opt/epp
WORKDIR /opt/epp

FROM base as build

COPY package.json package.json
COPY yarn.lock yarn.lock

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN yarn

FROM base as prod

COPY data data
COPY src/ src/
COPY package.json package.json
COPY --from=build node_modules node_modules
RUN yarn sass

EXPOSE 3000
CMD [ "yarn", "start" ]
