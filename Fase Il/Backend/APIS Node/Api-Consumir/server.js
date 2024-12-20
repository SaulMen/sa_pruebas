const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');

// Usamos CORS para permitir solicitudes desde el frontend
app.use(cors({
    origin: '*',
}));
app.use(express.json()); // Middleware para procesar JSON en el cuerpo de las solicitudes

// Conexion a la base de datos
const db = require('./db');

// Endpoint para obtener productos
app.get('/api-consumir/productos', (req, res) => {
    const query = `
        SELECT 
            p.id_producto AS sku,
            p.imagen_foto AS img,
            p.nombre_producto AS nombre,
            p.precio AS precio,
            p.stock AS stock,
            p.categoria AS categoria
        FROM productos p
        JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).json({ error: 'Error al obtener los productos' });
        }

        // Estructura del JSON de respuesta
        const response = {
            numgrupo: 18, // Número fijo, como se indicó
            productos: result
        };

        res.status(200).json(response);
    });
});

// Función para obtener productos de una API externa
async function obtenerProductosDeAPI(url) {
    try {
        const respuesta = await axios.get(url);
        //console.log('Respuesta de la API externa:', respuesta.data); // Mostrar la respuesta completa
        // Asegurarse de que el campo productos existe y tiene datos
        if (respuesta.data && respuesta.data.productos && respuesta.data.productos.length > 0) {
            return respuesta.data.productos;
        } else {
            throw new Error('No se obtuvieron productos de la API externa');
        }
    } catch (error) {
        console.error(`Error al obtener productos de ${url}:`, error.message);
        throw new Error(`Error al obtener productos de ${url}: ${error.message}`);
    }
}

// Función para insertar un producto en la base de datos
const insertarProducto = (producto) => {
    return new Promise((resolve, reject) => {
        // Verificar si el producto tiene los campos necesarios antes de intentar insertarlo
        if (!producto.nombre || !producto.precio || !producto.stock) {
            reject('Producto con datos faltantes: nombre, precio o stock.');
            return;
        }

        //console.log('Datos del producto a insertar:', producto);

        // Verificar si el producto ya existe en la base de datos
        const queryVerificar = 'SELECT * FROM productos WHERE nombre_producto = ?';
        db.query(queryVerificar, [producto.nombre], (err, result) => {
            if (err) {
                reject(`Error al verificar el producto existente: ${err}`);
            } else if (result.length > 0) {
                // Si el producto ya existe, no se inserta
                resolve('El producto ya existe.');
            } else {
                // Insertar el nuevo producto
                const queryInsertar = `
                    INSERT INTO productos (nombre_producto, precio, stock, categoria, imagen_foto)
                    VALUES (?, ?, ?, ?, ?)
                `;

                //console.log('Consulta de inserción:', queryInsertar);

                db.query(queryInsertar, [
                    producto.nombre,
                    parseFloat(producto.precio), // Convertir precio a decimal si es necesario
                    producto.stock,
                    producto.categoria || null, // Si la categoría no se proporciona, insertamos null
                    producto.img || null, // Si no hay imagen, se asigna null
                ], (err, result) => {
                    if (err) {
                        reject(`Error al insertar el producto: ${err}`);
                    } else {
                        resolve('Producto insertado correctamente.');
                    }
                });
            }
        });
    });
};


// Función para procesar los productos obtenidos desde una URL externa
async function procesarProductosExternos(url) {
    try {
        console.log(`Obteniendo productos de la API: ${url}`);
        const productosExternos = await obtenerProductosDeAPI(url);

        if (!productosExternos || productosExternos.length === 0) {
            throw new Error('No se obtuvieron productos de la API externa');
        }

        // Verificamos si los productos tienen los campos necesarios antes de proceder
        for (const producto of productosExternos) {
            //console.log('Producto recibido:', producto);
            if (!producto.nombre || !producto.precio || !producto.stock) {
                console.error('Producto con datos faltantes:', producto);
                continue; // Si algún campo es faltante, saltamos ese producto
            }

            // Asegúrate de que el producto tiene los campos correctos antes de insertarlo
            const mensaje = await insertarProducto(producto);
            console.log(mensaje);
        }

        //console.log('Productos procesados correctamente.');
    } catch (error) {
        console.error('Error al procesar productos externos:', error.message);
        throw new Error('Error al procesar productos externos: ' + error.message);
    }
}

// Endpoint POST para procesar productos desde una URL dinámica
app.post('/api-consumir/procesar-productos', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'La URL de la API externa es requerida.' });
    }

    try {
        await procesarProductosExternos(url);
        res.status(200).json({ mensaje: 'Productos procesados correctamente desde la API externa.' });
    } catch (error) {
        res.status(500).json({ error: `Error al procesar productos: ${error.message}` });
    }
});

// Iniciar el servidor
const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
module.exports = {
    app, 
    obtenerProductosDeAPI,
    insertarProducto,
};
