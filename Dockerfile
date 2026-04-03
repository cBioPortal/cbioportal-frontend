# cBioPortal Frontend - Static web server image
# Serves the built React SPA with fallback routing.
#
# Build:
#   docker build -t cbioportal/frontend:latest .
#
# Build with custom branch env:
#   docker build --build-arg BRANCH_ENV=rc -t cbioportal/frontend:rc .
#
# Run:
#   docker run -p 3000:80 cbioportal/frontend:latest

FROM node:22.18.0 AS builder
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq git > /dev/null 2>&1
RUN corepack enable
COPY package.json yarn.lock ./
COPY packages/ packages/
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ src/
COPY config/ config/
COPY public/ public/
COPY scripts/ scripts/
ARG BRANCH_ENV=master
ENV BRANCH_ENV=$BRANCH_ENV
RUN yarn run buildModules
RUN git config --global --add safe.directory /app && yarn run buildMain

FROM joseluisq/static-web-server:2-alpine
COPY --from=builder /app/dist /public
ENV SERVER_PORT=80
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=/public/index.html
ENV SERVER_LOG_LEVEL=info
EXPOSE 80
