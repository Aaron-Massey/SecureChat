FROM node:22-alpine AS build

WORKDIR /app

COPY config.json ./config.json
COPY backend/package*.json ./backend/

WORKDIR /app/backend
RUN npm ci

COPY backend/ ./

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app/backend
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/config.json /app/config.json
COPY --from=build /app/backend/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]