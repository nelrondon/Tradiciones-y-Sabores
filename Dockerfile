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

ARG VITE_API_URL
ARG VITE_API_KEY
ARG VITE_WHATSAPP_NUMERO

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_WHATSAPP_NUMERO=$VITE_WHATSAPP_NUMERO

RUN pnpm run build

# Etapa 2: Nginx Servidor Web
FROM nginx:1.25-alpine

# Copiar la carpeta compilada al directorio esperado por Nginx según el nginx.conf original
COPY --from=build /app/dist /var/www/html/dist

# Copiar la configuración de Nginx directamente a la imagen
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
