FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG API_BASE_URL=http://api:3000
ARG PUBLIC_APP_URL=https://caderno-express.otimizanegocio.com
ARG NEXT_PUBLIC_META_PIXEL_ID=
ENV API_BASE_URL=${API_BASE_URL}
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ENV NEXT_PUBLIC_META_PIXEL_ID=${NEXT_PUBLIC_META_PIXEL_ID}
RUN npm run build && npm prune --omit=dev --no-audit

FROM node:24-bookworm-slim AS runtime

ARG API_BASE_URL=http://api:3000
ARG PUBLIC_APP_URL=https://caderno-express.otimizanegocio.com
ENV API_BASE_URL=${API_BASE_URL}
ENV PUBLIC_APP_URL=${PUBLIC_APP_URL}
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts

USER node
EXPOSE 3001
CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]
