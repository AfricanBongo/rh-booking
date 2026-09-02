FROM node:20-alpine AS base
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev wget

FROM base AS deps
WORKDIR /opt/app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
WORKDIR /opt/app
COPY . .
EXPOSE 1337
CMD ["npm", "run", "develop"]

FROM deps AS production
WORKDIR /opt/app
COPY . .
ENV NODE_ENV=production
EXPOSE 1337
ENTRYPOINT ["/bin/sh", "-c"]
CMD ["[ -f /opt/app/dist/build/index.html ] && npm run start || (NODE_OPTIONS=\"--max-old-space-size=2048\" npm run build && npm run start)"]
