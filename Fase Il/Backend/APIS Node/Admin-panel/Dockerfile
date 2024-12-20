# Etapa 1: Construcción (construcción de dependencias)
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de configuración de dependencias
COPY package.json package-lock.json ./

# Instalar las dependencias de la aplicación
RUN npm install

# Copiar el código fuente de la aplicación
COPY . .

# Etapa 2: Imagen final
FROM node:18-alpine

# Establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar las dependencias instaladas desde la etapa anterior
COPY --from=builder /app /app

# Exponer el puerto en el que la aplicación escucha
EXPOSE 3003

# Comando para ejecutar la aplicación
CMD ["node", "server.js"]
