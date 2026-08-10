# Etapa 1: Build
FROM node:20-alpine as build

# Habilitar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Instalar dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copiar el código fuente y compilar
COPY . .
RUN pnpm run build

# Etapa 2: Nginx Servidor Web
FROM nginx:1.25-alpine

# Copiar la carpeta compilada al directorio esperado por Nginx según el nginx.conf original
COPY --from=build /app/dist /var/www/html/dist

# Copiar la configuración de Nginx y los certificados SSL directamente a la imagen
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/ssl /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
