import os
import mysql.connector
from mysql.connector import Error
# from dotenv import load_dotenv

# Cargar variables del archivo .env
# load_dotenv()

def get_db_connection():
    """
    Establece una conexión a la base de datos MySQL.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME")
        )
        if connection.is_connected():
            print("Conexión a la base de datos exitosa")
        return connection
    except Error as e:
        print(f"Error al conectar con la base de datos: {e}")
        return None
