ARG node_version=22.13-alpine3.20

FROM node:${node_version} as base

RUN mkdir /opt/epp
# this expects a volume to be mounted to /opt/epp
WORKDIR /opt/epp

FROM base as build

COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .yarnrc.yml .yarnrc.yml
COPY .yarn/releases .yarn/releases

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN yarn

FROM base as prod

COPY --from=build /opt/epp/node_modules node_modules
COPY package.json package.json
COPY src/ src/

EXPOSE 3000
CMD [ "yarn", "start" ]

FROM prod as dev
CMD [ "yarn", "start:dev" ]
