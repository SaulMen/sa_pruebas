import unittest
import jwt
import requests  # Librería para hacer peticiones HTTP

SECRET_KEY = "mi_clave_secreta"  # Reemplaza con tu clave real

class TestProcesarPagoSinDescuento(unittest.TestCase):
    def setUp(self):
        # Genera el token JWT
        self.token = jwt.encode({"id_usuario": 1, "tipo_usuario": "cliente"}, SECRET_KEY, algorithm="HS256")
        # Convertir el token a una cadena str
        self.token_str = str(self.token)
        #print(f"Token: {self.token_str}")
        #print(f"Clave Secreta: {SECRET_KEY}")

    def test_pago_exitoso(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5002/pago/procesar-pago/"  # Ajusta la URL según tu configuración

        # Realiza la solicitud POST a la API
        response = requests.post(url, json={"estado": "comprado"}, headers=headers)

        # Verifica que el código de estado sea 200 (éxito)
        self.assertEqual(response.status_code, 200)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        # Valida el mensaje exacto recibido en la respuesta
        self.assertEqual(data, {"mensaje": "Pago procesado exitosamente"})

    

   

   

   

    
