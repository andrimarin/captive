# Usa Node.js 20 LTS sobre Alpine (imagen ligera)
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json primero (para aprovechar cache de Docker)
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm ci --only=production

# Copia el código de la aplicación
COPY . .

# Crea un usuario no-root por seguridad
RUN addgroup -g 1001 -S portal && \
    adduser -S portal -u 1001 -G portal

# Cambia ownership de los archivos
RUN chown -R portal:portal /app

# Cambia al usuario no-root
USER portal

# Expone el puerto 3000
EXPOSE 3000

# Variables de entorno por defecto (pueden sobrescribirse con docker run o docker-compose)
ENV NODE_ENV=production \
    PORT=3000

# Healthcheck para que Docker sepa si el servicio está vivo
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]