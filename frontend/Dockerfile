FROM node:22-alpine AS build

WORKDIR /app

COPY config.json ./config.json
COPY .env* ./
COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm install

COPY frontend/ ./

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache openssl

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
