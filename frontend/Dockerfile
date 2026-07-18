FROM node:22-alpine AS build

WORKDIR /app

COPY config.json ./config.json
COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm install

COPY frontend/ ./

RUN npm run build-only

FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
