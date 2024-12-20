# Usa una imagen base de Python
FROM python:3.10-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo requirements.txt en el contenedor
COPY requirements.txt .

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto de los archivos de la aplicación
COPY . .

# Expon el puerto en el que el servidor va a correr (ajusta si es necesario)
EXPOSE 5000

# Comando para ejecutar el servidor (ajústalo según tu caso)
CMD ["python", "server.py"]
