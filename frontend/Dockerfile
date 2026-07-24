FROM node:22-alpine AS build

WORKDIR /app

COPY config.json ./config.json
COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm install

COPY frontend/ ./

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache openssl

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/40-auto-certs.sh /docker-entrypoint.d/40-auto-certs.sh
RUN chmod +x /docker-entrypoint.d/40-auto-certs.sh
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
