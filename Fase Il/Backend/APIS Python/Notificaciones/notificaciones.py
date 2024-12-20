# notificaciones.py
import os
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from db import get_db_connection
import datetime
# from dotenv import load_dotenv

# load_dotenv()
password_mail = 'mwqm adow kxsu oaij'
mail_account = 'andreenil15@gmail.com'


def enviar_correo(correo, asunto, cuerpo):
    # Crear el mensaje
    msg = MIMEMultipart()
    msg['From'] = mail_account
    msg['To'] = correo
    msg['Subject'] = asunto
    msg.attach(MIMEText(cuerpo, 'html'))

    # Enviar el correo
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as servidor:
            servidor.starttls()
            servidor.login('andreenil15@gmail.com', password_mail)
            servidor.sendmail(msg['From'], msg['To'], msg.as_string())
        print("Correo enviado exitosamente")
    except Exception as e:
        print(f"Error al enviar el correo: {e}")

# Función para enviar notificaciones de carritos abandonados a los clientes
def notificacion_carrito_abandonado():
    try:
        connection = get_db_connection()
        if not connection:
            print("Error al conectar con la base de datos")
            return

        cursor = connection.cursor(dictionary=True)
        fecha_actual = datetime.datetime.now()
        limite_tiempo = fecha_actual - datetime.timedelta(minutes=5)

        cursor.execute(
            "SELECT u.email, p.nombre_producto, p.precio, cp.cantidad, (p.precio * cp.cantidad) AS subtotal "
            "FROM carrito cp "
            "JOIN usuarios u ON cp.id_cliente = u.id_usuario "
            "JOIN productos p ON cp.id_producto = p.id_producto "
            "WHERE cp.estado = 'pendiente' AND cp.fecha_creacion < %s",
            (limite_tiempo,)
        )

        carritos_pendientes = cursor.fetchall()
        for carrito in carritos_pendientes:
            email = carrito['email']
            productos = [carrito]
            subtotal = sum(p['subtotal'] for p in productos)
            cuerpo = f"""
            <html>
                <body>
                    <h2>Recordatorio: Compra Pendiente</h2>
                    <p>Estimado/a,</p>
                    <p>Tienes productos en tu carrito pendientes:</p>
                    <ul>
            """
            for producto in productos:
                nombre_producto = str(producto['nombre_producto'])
                precio = str(producto['precio'])
                cantidad = str(producto['cantidad'])
                subtotal_producto = str(producto['subtotal'])
                cuerpo += f"<li>{nombre_producto} - Precio: {precio} - Cantidad: {cantidad} - Subtotal: {subtotal_producto}</li>"
            cuerpo += f"""
                </ul>
                <p>Total pendiente: {subtotal}</p>
                <p>Por favor, regresa a tu carrito para completar la compra.</p>
            </body>
            </html>
            """
            enviar_correo(email, 'Recordatorio de Compra Pendiente', cuerpo)

        cursor.close()
        connection.close()

    except Exception as e:
        print(f"Error al procesar el recordatorio de carrito abandonado: {e}")

# Función para enviar notificaciones de stock bajo a los proveedores
def notificacion_stock_bajo():
    try:
        connection = get_db_connection()
        if not connection:
            print("Error al conectar con la base de datos")
            return

        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT p.id_proveedor, p.nombre_producto, p.stock, u.email "
            "FROM productos p "
            "JOIN usuarios u ON p.id_proveedor = u.id_usuario "
            "WHERE p.stock <= 10 AND u.tipo_usuario = 'proveedor'"
        )

        productos_bajos_stock = cursor.fetchall()
        for producto in productos_bajos_stock:
            email = producto['email']
            nombre_producto = producto['nombre_producto']
            stock = producto['stock']
            cuerpo = f"""
            <html>
                <body>
                    <h2>Notificación de Stock Bajo</h2>
                    <p>Estimado/a,</p>
                    <p>El producto '{nombre_producto}' tiene un stock bajo de solo {stock} unidades.</p>
                    <p>Por favor, reabastezca el inventario.</p>
                </body>
            </html>
            """
            enviar_correo(email, 'Notificación de Stock Bajo', cuerpo)

        cursor.close()
        connection.close()

    except Exception as e:
        print(f"Error al procesar la notificación de stock bajo: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python notificaciones.py [carrito_abandonado|stock_bajo]")
        sys.exit(1)

    accion = sys.argv[1]
    if accion == "carrito_abandonado":
        notificacion_carrito_abandonado()
    elif accion == "stock_bajo":
        notificacion_stock_bajo()
    else:
        print("Acción desconocida")
        sys.exit(1)
