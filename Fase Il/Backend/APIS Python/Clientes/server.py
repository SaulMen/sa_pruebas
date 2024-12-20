import jwt
from flask import Flask, jsonify, request
from db import get_db_connection
from flask_cors import CORS
from io import BytesIO
from werkzeug.utils import secure_filename
import os
import base64
import boto3

app = Flask(__name__)
CORS(app)

# Clave secreta para JWT
SECRET_KEY = os.getenv("JWT_SECRET")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION") 
AWS_ACCESS_KEY_ID = os.getenv("S3_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = os.getenv("S3_SECRET_KEY")

# Endpoint para obtener la información de un cliente
@app.route('/cliente/info', methods=['GET'])
def obtener_informacion_cliente():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    connection = get_db_connection()
    if not connection:
        return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

    cursor = connection.cursor(dictionary=True)
    try:
        consulta = """
        SELECT 
            c.nombre_completo, 
            u.email, 
            u.celular, 
            c.imagen_foto
        FROM 
            clientes c
        INNER JOIN 
            usuarios u 
        ON 
            c.id_cliente = u.id_usuario
        WHERE 
            c.id_cliente = %s
        """
        cursor.execute(consulta, (id_cliente,))
        resultado = cursor.fetchone()

        if not resultado:
            return jsonify({"error": "Cliente no encontrado"}), 404

        # Si la imagen es un URL, retornarla directamente
        if resultado["imagen_foto"]:
            resultado["imagen_foto"] = resultado["imagen_foto"]  # URL de la imagen
        else:
            resultado["imagen_foto"] = None

        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/cliente/subir_foto', methods=['POST'])
def subir_fotografia():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    datos = request.get_json()
    if not datos or 'Fotografia' not in datos:
        return jsonify({"error": "Se requiere la fotografía en Base64"}), 400

    try:
        foto_base64 = datos['Fotografia']
        foto_bytes = base64.b64decode(foto_base64)

        # Subir la imagen a Amazon S3
        s3_client = boto3.client(
            's3',
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=S3_REGION  # Aquí especificamos la región de S3
        )

        filename = secure_filename(f"perfil-new-{id_cliente}.jpg")
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=filename, Body=BytesIO(foto_bytes))

        # Generar la URL de la imagen en S3
        imagen_url = f"https://{S3_BUCKET_NAME}.s3.{S3_REGION}.amazonaws.com/{filename}"

        # Almacenar la URL en la base de datos
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

        cursor = connection.cursor()
        consulta = """
        UPDATE clientes
        SET imagen_foto = %s
        WHERE id_cliente = %s
        """
        cursor.execute(consulta, (imagen_url, id_cliente))
        connection.commit()

        return jsonify({"mensaje": "Fotografía subida correctamente"}), 200

    except base64.binascii.Error:
        return jsonify({"error": "El formato de la fotografía no es válido"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para registrar tarjeta de crédito/débito
@app.route('/cliente/registrar_tarjeta', methods=['POST'])
def registrar_tarjeta():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    datos = request.get_json()
    if not datos:
        return jsonify({"error": "Los datos de la tarjeta son requeridos"}), 400

    numero_tarjeta = datos.get('numero_tarjeta')
    fecha_expiracion = datos.get('fecha_expiracion')
    tipo_tarjeta = datos.get('tipo_tarjeta')

    if not numero_tarjeta or not fecha_expiracion or not tipo_tarjeta:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if tipo_tarjeta not in ['debito', 'credito']:
        return jsonify({"error": "El tipo de tarjeta debe ser 'debito' o 'credito'"}), 400

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

        cursor = connection.cursor()
        consulta = """
        INSERT INTO tarjetas (id_cliente, numero_tarjeta, fecha_expiracion, tipo_tarjeta)
        VALUES (%s, %s, %s, %s)
        """
        cursor.execute(consulta, (id_cliente, numero_tarjeta, fecha_expiracion, tipo_tarjeta))
        connection.commit()

        return jsonify({"mensaje": "Tarjeta registrada correctamente"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint para obtener las tarjetas de un cliente
@app.route('/cliente/tarjetas', methods=['GET'])
def obtener_tarjetas():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

        cursor = connection.cursor(dictionary=True)
        consulta = """
        SELECT id_tarjeta, numero_tarjeta, tipo_tarjeta 
        FROM tarjetas 
        WHERE id_cliente = %s
        """
        cursor.execute(consulta, (id_cliente,))
        tarjetas = cursor.fetchall()

        return jsonify({"tarjetas": tarjetas}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint para eliminar una tarjeta de débito/crédito
@app.route('/cliente/tarjetas/<int:id_tarjeta>', methods=['DELETE'])
def eliminar_tarjeta(id_tarjeta):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

        cursor = connection.cursor()
        consulta_verificacion = """
        SELECT id_tarjeta FROM tarjetas 
        WHERE id_tarjeta = %s AND id_cliente = %s
        """
        cursor.execute(consulta_verificacion, (id_tarjeta, id_cliente))
        tarjeta = cursor.fetchone()

        if not tarjeta:
            return jsonify({"error": "La tarjeta no pertenece al cliente"}), 404

        consulta_eliminacion = """
        DELETE FROM tarjetas WHERE id_tarjeta = %s
        """
        cursor.execute(consulta_eliminacion, (id_tarjeta,))
        connection.commit()

        return jsonify({"message": "Tarjeta eliminada exitosamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint para obtener las compras de un cliente
@app.route('/cliente/compras', methods=['GET'])
def obtener_compras_cliente():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500

        cursor = connection.cursor(dictionary=True)
        # Se une la tabla carrito con productos para obtener los nombres de los productos comprados
        consulta = """
        SELECT 
            c.id_carrito,
            c.id_producto, 
            p.nombre_producto, 
            c.cantidad, 
            c.subtotal
        FROM 
            carrito c
        INNER JOIN 
            productos p 
        ON 
            c.id_producto = p.id_producto
        WHERE 
            c.id_cliente = %s 
            AND c.estado = 'comprado'
            AND c.cantidad > 0  -- Filtro añadido para excluir productos con cantidad 0
        """
        cursor.execute(consulta, (id_cliente,))
        compras = cursor.fetchall()

        if not compras:
            return jsonify({"error": "No se encontraron compras para el cliente"}), 404

        return jsonify({"compras": compras}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()


# Endpoint para procesar devoluciones
@app.route('/cliente/devolucion', methods=['POST'])
def procesar_devolucion():
    # Verificar autenticación mediante JWT
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    # Procesar devolución
    data = request.json
    id_producto = data.get('id_producto')
    cantidad_devuelta = data.get('cantidad')

    if not id_producto or not cantidad_devuelta:
        return jsonify({"error": "Datos incompletos. Se requiere id_producto y cantidad"}), 400

    try:
        # Conexión a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verificar si el producto existe en el carrito con estado 'comprado'
        consulta_carrito = """
        SELECT id_carrito, cantidad, subtotal
        FROM carrito
        WHERE id_producto = %s AND id_cliente = %s AND estado = 'comprado'
        AND cantidad!=0 AND subtotal!=0 LIMIT 1
        """
        cursor.execute(consulta_carrito, (id_producto, id_cliente))
        carrito = cursor.fetchone()

        if not carrito:
            return jsonify({"error": "No se encontró el producto en el carrito con estado 'comprado'"}), 404

        id_carrito = carrito['id_carrito']
        cantidad_carrito = carrito['cantidad']
        subtotal_carrito = carrito['subtotal']
        print(cantidad_carrito, subtotal_carrito, cantidad_devuelta)

        
        # Calcular monto reembolsado proporcional
        monto_reembolsado = subtotal_carrito / cantidad_carrito * cantidad_devuelta

        # Llenar la tabla devoluciones
        insertar_devolucion = """
        INSERT INTO devoluciones (id_carrito, cantidad_devuelta, monto_reembolsado, estado)
        VALUES (%s, %s, %s, 'pendiente')
        """
        cursor.execute(insertar_devolucion, (id_carrito, cantidad_devuelta, monto_reembolsado))

        # Actualizar cantidad en el carrito
        nueva_cantidad_carrito = cantidad_carrito - cantidad_devuelta
        if nueva_cantidad_carrito >= 0:
            actualizar_carrito = """
            UPDATE carrito
            SET cantidad = %s, subtotal = %s
            WHERE id_carrito = %s
            """
            nuevo_subtotal = subtotal_carrito - monto_reembolsado
            cursor.execute(actualizar_carrito, (nueva_cantidad_carrito, nuevo_subtotal, id_carrito))
        else:
            # Eliminar producto del carrito si la cantidad queda en 0
            eliminar_carrito = "DELETE FROM carrito WHERE id_carrito = %s"
            cursor.execute(eliminar_carrito, (id_carrito,))

        # Actualizar stock del producto
        actualizar_stock = """
        UPDATE productos
        SET stock = stock + %s
        WHERE id_producto = %s
        """
        cursor.execute(actualizar_stock, (cantidad_devuelta, id_producto))

        # Verificar si el cliente ya tiene un saldo en la cartera
        consulta_cartera = """
        SELECT saldo FROM cartera_clientes WHERE id_cliente = %s
        """
        cursor.execute(consulta_cartera, (id_cliente,))
        cartera = cursor.fetchone()

        if cartera:
            # Si ya tiene un saldo, actualizarlo
            saldo_actual = cartera['saldo']
            nuevo_saldo = saldo_actual + monto_reembolsado
            actualizar_saldo = """
            UPDATE cartera_clientes
            SET saldo = %s
            WHERE id_cliente = %s
            """
            cursor.execute(actualizar_saldo, (nuevo_saldo, id_cliente))
        else:
            # Si no tiene un saldo, insertamos un nuevo registro
            insertar_saldo = """
            INSERT INTO cartera_clientes (id_cliente, saldo)
            VALUES (%s, %s)
            """
            cursor.execute(insertar_saldo, (id_cliente, monto_reembolsado))

        # Confirmar transacción
        connection.commit()

        return jsonify({"mensaje": "Devolución procesada exitosamente"}), 200

    except Exception as e:
        connection.rollback()  # Revertir cambios en caso de error
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# Endpoint para obtener el saldo de la cartera de un cliente
@app.route('/cliente/saldo', methods=['GET'])
def obtener_saldo_cartera():
    # Verificar autenticación mediante JWT
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"error": "Token no proporcionado o inválido"}), 401

    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        id_cliente = payload.get('id_usuario')
        tipo_usuario = payload.get('tipo_usuario')

        if tipo_usuario != 'cliente':
            return jsonify({"error": "Tipo de usuario no autorizado"}), 403

    except jwt.ExpiredSignatureError:
        return jsonify({"error": "El token ha expirado"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Token inválido"}), 401

    try:
        # Conexión a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Obtener saldo de la cartera del cliente
        consulta_saldo = """
        SELECT saldo
        FROM cartera_clientes
        WHERE id_cliente = %s
        """
        cursor.execute(consulta_saldo, (id_cliente,))
        saldo = cursor.fetchone()

        if not saldo:
            return jsonify({"saldo": 0.0}), 200

        return jsonify({"saldo": saldo['saldo']}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()


# Endpoint para obtener las devoluciones de un cliente
@app.route('/cliente/devoluciones', methods=['GET'])
def obtener_devoluciones_cliente():
    # Verificar autenticación mediante JWT
    

    try:
        # Conexión a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Obtener devoluciones del cliente
        consulta_devoluciones = """
        SELECT id_devolucion, id_carrito, cantidad_devuelta, monto_reembolsado, estado, comentario_rechazo
        FROM devoluciones
        WHERE id_carrito IN (SELECT id_carrito FROM carrito) AND estado='pendiente'
        """
        cursor.execute(consulta_devoluciones)
        devoluciones = cursor.fetchall()

        if not devoluciones:
            return jsonify({"devoluciones": []}), 200

        return jsonify({"devoluciones": devoluciones}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/cliente/devoluciones/<int:id_devolucion>', methods=['PUT'])
def gestionar_devolucion_cliente(id_devolucion):
    # Verificar autenticación mediante JWT
    

    # Parámetros para la actualización
    data = request.get_json()
    estado = data.get('estado')
    comentario_rechazo = data.get('comentario_rechazo')
    if comentario_rechazo:
        comentario_rechazo=''
    print("hola1")
    try:
        # Conexión a la base de datos
        connection = get_db_connection()
        cursor = connection.cursor()
        print("hola2")

        # Actualizar estado y comentario de rechazo
        consulta_actualizacion = """
        UPDATE devoluciones
        SET estado = %s, comentario_rechazo = %s
        WHERE id_devolucion = %s AND id_carrito IN (SELECT id_carrito FROM carrito)
        """
        print("hola2.5")
        print(f"Estado: {estado}, Comentario: {comentario_rechazo}, ID: {id_devolucion}")

        cursor.execute(consulta_actualizacion, (estado, comentario_rechazo, id_devolucion))
        connection.commit()
        print("hola3")

        if cursor.rowcount == 0:
            return jsonify({"error": "Devolución no encontrada o no autorizada para modificar"}), 404

        return jsonify({"mensaje": "Devolución actualizada correctamente"}), 200
    
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
