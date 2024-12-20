import jwt
from flask import Flask, jsonify, request
from db import get_db_connection
from flask_cors import CORS
import os

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from decimal import Decimal, ROUND_DOWN


app = Flask(__name__)
CORS(app)


SECRET_KEY = os.getenv("JWT_SECRET")

# Función para enviar correo con detalles de compra
def enviar_correo_con_productos(email, productos, moneda, descuento=None):
    productos_convertidos = []
    total_convertido = Decimal(0)  # Para almacenar el total de la compra convertido

    for producto in productos:
        nombre_producto = str(producto['nombre_producto'])
        precio = Decimal(producto['precio']) + Decimal(producto['precio']) * Decimal(0.1)  # Añadir 10% de impuestos
        cantidad = int(producto['cantidad'])
        subtotal_producto = Decimal(producto['subtotal'])

        # Convertir precio y subtotal
        precio_convertido = convertir_precio(precio, moneda) if moneda else precio
        subtotal_convertido = convertir_precio(subtotal_producto, moneda) if moneda else subtotal_producto

        # Redondear precios a dos decimales
        precio_convertido = precio_convertido.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
        subtotal_convertido = subtotal_convertido.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

        # Sumar el subtotal convertido al total
        total_convertido += subtotal_convertido

        productos_convertidos.append({
            'nombre_producto': nombre_producto,
            'precio': precio_convertido,
            'cantidad': cantidad,
            'subtotal': subtotal_convertido
        })

    # Aplicar descuento si existe
    if descuento:
        # Convertir el descuento de porcentaje a decimal
        descuento_decimal = Decimal(descuento) / Decimal(100)
        total_con_descuento = total_convertido - total_convertido * descuento_decimal
        total_con_descuento = total_con_descuento.quantize(Decimal('0.01'), rounding=ROUND_DOWN)
    else:
        total_con_descuento = total_convertido

    # Crear el mensaje
    msg = MIMEMultipart()
    msg['From'] = 'andreenil15@gmail.com'
    msg['To'] = email
    msg['Subject'] = 'Confirmación de Compra'

    # Cuerpo del correo en HTML
    cuerpo = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
                <img src="https://www.loquequierasya.com/wp-content/uploads/2011/07/Vender-en-Internet.jpg" alt="Imagen de venta en internet" style="width: 100%; border-radius: 5px;">
                <h2 style="color: #333;">Gracias por tu compra</h2>
                <p style="color: #666;">Productos comprados:</p>
                <ul style="list-style: none; padding: 0;">
    """
    
    for producto in productos_convertidos:
        cuerpo += f"<li style='background-color: #e9e9e9; padding: 10px; margin: 5px 0; border-radius: 3px;'><strong>{producto['nombre_producto']}</strong> - Precio: {producto['precio']} - Cantidad: {producto['cantidad']} - Subtotal: {producto['subtotal']}</li>"

    cuerpo += f"""
                </ul>
                <p style="color: #666;">Total de la compra: <strong>{total_convertido}</strong></p>
                <p style="color: #666;">Total de la compra con descuento: <strong>{total_con_descuento}</strong></p>
            </div>
        </body>
    </html>
    """
    
    msg.attach(MIMEText(cuerpo, 'html'))

    # Enviar el correo
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as servidor:
            servidor.starttls()
            servidor.login('andreenil15@gmail.com', 'mwqm adow kxsu oaij')
            servidor.sendmail(msg['From'], msg['To'], msg.as_string())
        print("Correo enviado exitosamente")
    except Exception as e:
        print(f"Error al enviar el correo: {e}")

# Función para convertir precios según la moneda
def convertir_precio(precio, moneda):
    if not moneda:
        return precio  # Si no se pasa moneda, no se realiza conversión
    
    # Obtener la tasa de conversión desde la base de datos
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    #SELECT conversion FROM currencyconversion WHERE name=?
    cursor.execute(f"SELECT conversion FROM currencyconversion WHERE name='{moneda}' LIMIT 1")
    conversion = cursor.fetchone()
    print("la conversión es: ", conversion['conversion'])
    # Asegúrate de que la conversión exista
    if not conversion:
        raise ValueError("Tasas de conversión no encontradas en la base de datos")

    cursor.close()

    # Convertir el precio usando la tasa de conversión según la moneda
    return Decimal(precio) / Decimal(conversion['conversion'])
    # if moneda == 'usd':
    #     return Decimal(precio) / Decimal(conversion['usd'])
    # elif moneda == 'mxn':
    #     return Decimal(precio) / Decimal(conversion['mxn'])
    # elif moneda == 'jpy':
    #     return Decimal(precio) / Decimal(conversion['jpy'])
    # else:
    #     raise ValueError("Moneda no soportada")


@app.route('/pago/procesar-pago/', methods=['POST'])
@app.route('/pago/procesar-pago/<moneda>', methods=['POST'])
def procesar_pago(moneda=None):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Token no proporcionado o inválido"}), 401

        # Extraer el token JWT
        token = auth_header.split(" ")[1]
        
        try:
            # Decodificar el token usando la clave secreta
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            id_cliente = payload.get('id_usuario')
            tipo_usuario = payload.get('tipo_usuario')
            
            if tipo_usuario != 'cliente':
                return jsonify({"error": "Tipo de usuario no autorizado"}), 403

            # Obtener datos del body de la solicitud
            data = request.json
            if not data or 'estado' not in data or data['estado'] != 'comprado':
                return jsonify({"error": "Datos incompletos o estado incorrecto"}), 400

            # Verificar si se proporciona un código de cupón
            codigo_cupon = data.get('codigo_cupon')
            
            # Realizar consulta a la base de datos para obtener el carrito de compras del cliente con estado pendiente
            connection = get_db_connection()
            cursor = connection.cursor(dictionary=True)

            # Consulta para obtener todos los productos con estado pendiente en el carrito del cliente
            cursor.execute(
                "SELECT p.nombre_producto, p.precio, cp.cantidad, (p.precio * cp.cantidad * 1.1) AS subtotal "
                "FROM carrito c "
                "JOIN carrito cp ON c.id_carrito = cp.id_carrito "
                "JOIN productos p ON cp.id_producto = p.id_producto "
                "WHERE c.id_cliente = %s AND c.estado = 'pendiente'", (id_cliente, )
            )
            productos = cursor.fetchall()
            
            if not productos:
                return jsonify({"error": "Carrito no encontrado o estado no válido"}), 404

            # Calcular el total de la compra
            #total_compra = sum(Decimal(p['subtotal']) for p in productos)

            # Aplicar descuento del cupón si existe
            if codigo_cupon:
                descuento = verificar_codigo_cupon(codigo_cupon, id_cliente)
                if descuento is None:
                    return jsonify({"error": "Código de cupón inválido ó vencido ó llego a su limite"}), 400
                #total_compra -= total_compra * descuento
            else:
                descuento = 0

            # Convertir el total a la moneda seleccionada (si corresponde)
            #total_compra_convertido = convertir_precio(total_compra, moneda)

            # Redondear el total convertido a dos decimales
            #total_compra_convertido = total_compra_convertido.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

            # Cambiar estado del carrito a 'comprado'
            cursor.execute("UPDATE carrito SET estado = 'comprado' WHERE id_cliente = %s", (id_cliente,))
            connection.commit()

            # Obtener el correo electrónico del cliente
            cursor.execute("SELECT email FROM usuarios WHERE id_usuario = %s", (id_cliente, ))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "Correo electrónico no encontrado"}), 404
            email = result['email']
            
            # Cerrar el cursor y la conexión después de realizar todas las operaciones
            cursor.close()
            connection.close()

            # Enviar el correo de confirmación con los productos y el total de la compra
            enviar_correo_con_productos(email=email, productos=productos, moneda=moneda, descuento=descuento)
            
            return jsonify({"mensaje": "Pago procesado exitosamente"}), 200

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401

    except Exception as e:
        print(f"Error al procesar el pago: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500


# Función para verificar y aplicar un código de cupón
def verificar_codigo_cupon(codigo_cupon, id_cliente):
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Verificar si el código de cupón es válido y no ha vencido
        cursor.execute(
            "SELECT id_cupon, porcentaje_descuento, fecha_vencimiento, usos_totales, usos_por_cliente "
            "FROM cupones "
            "WHERE codigo_cupon = %s AND fecha_vencimiento >= CURDATE() AND usos_totales > 0",
            (codigo_cupon,)
        )
        cupon = cursor.fetchone()

        if not cupon:
            cursor.close()
            connection.close()
            return None  # Código de cupón no válido o vencido

        # Verificar cuántos usos ha realizado este cliente para el cupón
        cursor.execute(
            "SELECT usos "
            "FROM cliente_cupones "
            "WHERE id_cliente = %s AND id_cupon = %s",
            (id_cliente, cupon['id_cupon'])
        )
        cliente_cupon = cursor.fetchone()

        if cliente_cupon and cliente_cupon['usos'] >= cupon['usos_por_cliente']:
            cursor.close()
            connection.close()
            return None  # El cliente ha alcanzado el límite de usos para este cupón

        # Registrar el uso del cupón para el cliente
        if cliente_cupon:
            # Si ya tiene un registro, se incrementa el uso
            cursor.execute(
                "UPDATE cliente_cupones SET usos = usos + 1 WHERE id_cliente = %s AND id_cupon = %s",
                (id_cliente, cupon['id_cupon'])
            )
        else:
            # Si no tiene un registro, se crea uno nuevo
            cursor.execute(
                "INSERT INTO cliente_cupones (id_cliente, id_cupon, usos) VALUES (%s, %s, 1)",
                (id_cliente, cupon['id_cupon'])
            )

        # Restar un uso al total de usos del cupón
        cursor.execute(
            "UPDATE cupones SET usos_totales = usos_totales - 1 WHERE id_cupon = %s",
            (cupon['id_cupon'],)
        )
        connection.commit()

        # Obtener el porcentaje de descuento
        descuento = cupon['porcentaje_descuento']

        cursor.close()
        connection.close()

        return descuento

    except Exception as e:
        print(f"Error al verificar el código de cupón: {str(e)}")
        return None


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
