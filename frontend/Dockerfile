FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./
RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache openssl

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY 40-auto-certs.sh /docker-entrypoint.d/40-auto-certs.sh
RUN chmod +x /docker-entrypoint.d/40-auto-certs.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
