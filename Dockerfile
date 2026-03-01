# Archivo Docker base para el despliegue a Easypanel
# Nota: La sintaxis final dependerá del framework frontend a elegir por el respectivo agente y el usuario.
# A continuación se provee un molde para una Single Page Application estática de dos etapas (Ej. Vite o React):

# --- ETAPA 1: Construcción (Builder) ---
# FROM node:20-alpine AS builder
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci || npm install

# COPY . .
# RUN npm run build

# --- ETAPA 2: Servidor de Producción (Nginx) ---
FROM nginx:alpine

# Una vez habilitado el builder de arriba, esta línea copiará la build generada a tu web server
# Cambiar 'dist' por 'build' o 'out' en caso de que el framework escogido lo requiera:
# COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto por defecto de nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
