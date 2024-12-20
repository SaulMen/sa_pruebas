import unittest
import jwt
import requests  # Librería para hacer peticiones HTTP

SECRET_KEY = "mi_clave_secreta"  # Reemplaza con tu clave real

class TestClienteAPI(unittest.TestCase):

    def setUp(self):
        # Genera el token JWT
        self.token = jwt.encode({"id_usuario": 1, "tipo_usuario": "cliente"}, SECRET_KEY, algorithm="HS256")
        # Convertir el token a una cadena str
        self.token_str = str(self.token)
        #print(f"Token: {self.token_str}")
        #print(f"Clave Secreta: {SECRET_KEY}")

    def test_obtener_informacion_cliente(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5000/cliente/info"  # Ajusta la URL según tu configuración

        # Realiza la solicitud GET a la API
        response = requests.get(url, headers=headers)

        # Verifica que el código de estado sea 200 (éxito)
        self.assertEqual(response.status_code, 200)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        # Valida los datos recibidos en la respuesta
        self.assertIn("nombre_completo", data)
        self.assertIn("email", data)

    def test_registrar_tarjeta(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5000/cliente/registrar_tarjeta"  
        payload = {
            "numero_tarjeta": "4111111111111111",
            "fecha_expiracion": "2027-12-31",
            "tipo_tarjeta": "credito"
        }

        # Realiza la solicitud POST a la API
        response = requests.post(url, json=payload, headers=headers)

        # Verifica que el código de estado sea 201 (creado)
        self.assertEqual(response.status_code, 201)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        # Verifica que el mensaje recibido sea el esperado
        self.assertEqual(data["mensaje"], "Tarjeta registrada correctamente")


    def test_obtener_tarjetas(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5000/cliente/tarjetas"  

         # Realiza la solicitud GET a la API
        response = requests.get(url, headers=headers)

        # Verifica que el código de estado sea 200 (éxito)
        self.assertEqual(response.status_code, 200)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        # Valida los datos recibidos en la respuesta
        assert "tarjetas" in data
        assert isinstance(data["tarjetas"], list)

    def test_eliminar_tarjeta(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5000/cliente/tarjetas/5"

         # Realiza la solicitud GET a la API
        response = requests.delete(url, headers=headers)

        # Verifica que el código de estado sea 200 (éxito)
        self.assertEqual(response.status_code, 200)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        assert data["message"] == "Tarjeta eliminada exitosamente"


    def test_obtener_saldo_cliente(self):
        headers = {"Authorization": f"Bearer {self.token_str}"}
        url = "http://localhost:5000/cliente/saldo"  # Ajusta la URL según tu configuración

        # Realiza la solicitud GET a la API
        response = requests.get(url, headers=headers)

        # Verifica que el código de estado sea 200 (éxito)
        self.assertEqual(response.status_code, 200)

        # Extrae el contenido JSON de la respuesta
        data = response.json()

        # Verifica que la clave 'saldo' esté presente en la respuesta
        self.assertIn("saldo", data)




if __name__ == '__main__':
    unittest.main()
