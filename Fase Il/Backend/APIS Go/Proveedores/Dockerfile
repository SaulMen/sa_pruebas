# Utiliza una imagen base que incluya el entorno de Go
FROM golang:1.23-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el código fuente de la aplicación al directorio de trabajo
COPY . .

# Descarga e instala las dependencias de la aplicación
RUN go mod download

# Compila la aplicación
RUN go build -o main .

# Expone el puerto en el que escucha tu aplicación (si es necesario)
EXPOSE 8081

# Comando por defecto que se ejecutará cuando se inicie el contenedor
CMD ["./main"]
