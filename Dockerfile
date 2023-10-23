# Étape 1 : Build de l'application Angular
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
COPY ./nodejs/package*.json ./nodejs/
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Utilisation de NGINX pour servir l'application construite
FROM nginx:alpine
COPY --from=build /app/dist/* /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
