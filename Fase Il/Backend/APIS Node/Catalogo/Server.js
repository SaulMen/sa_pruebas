
// Importar módulos
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

app.use(cors({
    origin: '*', // Permite solicitudes desde tu frontend
}));



// Conexion a la base de datos
const db = require('./db');


// Acceder a la clave secreta desde el archivo .env
const SECRET_KEY = process.env.JWT_SECRET;

app.use(express.json());

// Middleware para registrar todas las peticiones
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});


// Buscar productos por categoría con o sin conversión de moneda
app.post('/catalogo/productos-buscar/:moneda?', (req, res) => {
    const { categoria } = req.body; // Obtener la categoría desde el cuerpo de la solicitud
    const { moneda } = req.params; // Obtener la moneda desde los parámetros de la URL (opcional)

    if (!moneda) {
        // Si no se especifica moneda, devolver productos sin conversión
        const querySinConversion = `
            SELECT p.id_producto, p.nombre_producto, p.stock, p.categoria, pr.nombre_empresa,
                   p.precio + (p.precio * 0.10) AS precio_final, p.imagen_foto
            FROM productos p
            JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
            WHERE p.categoria = ?
        `;

        db.query(querySinConversion, [categoria], (err, productosResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al buscar productos' });
            }

            if (productosResult.length === 0) {
                return res.status(404).json({ mensaje: 'No se encontraron productos en esa categoría' });
            }

            res.status(200).json({ productos: productosResult });
        });
    } else {
        // Si se especifica moneda, realizar conversión
        const queryTasaCambio = `
            SELECT ${moneda} AS tasa_cambio 
            FROM CurrencyConversion
        `;

        db.query(queryTasaCambio, (err, tasaCambioResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener la tasa de cambio' });
            }

            if (tasaCambioResult.length === 0 || !tasaCambioResult[0].tasa_cambio) {
                return res.status(404).json({ mensaje: `La moneda "${moneda}" no está soportada.` });
            }

            const tasaCambio = tasaCambioResult[0].tasa_cambio;

            const queryProductos = `
                SELECT p.id_producto, p.nombre_producto, p.stock, p.categoria, pr.nombre_empresa,
                       ((p.precio + (p.precio * 0.10)) / ?) AS precio_final, p.imagen_foto
                FROM productos p
                JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
                WHERE p.categoria = ?
            `;

            db.query(queryProductos, [tasaCambio, categoria], (err, productosResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al buscar productos' });
                }

                if (productosResult.length === 0) {
                    return res.status(404).json({ mensaje: 'No se encontraron productos en esa categoría' });
                }

                res.status(200).json({ productos: productosResult });
            });
        });
    }
});



// Endpoint para obtener productos con o sin conversión de moneda
app.get('/catalogo/productos/:moneda?', (req, res) => {
    const { moneda } = req.params; // Obtener la moneda de los parámetros de la URL (opcional)

    if (!moneda) {
        // Si no se especifica moneda, devolver los productos sin conversión
        const querySinConversion = `
            SELECT p.id_producto, p.nombre_producto, p.stock, p.categoria, pr.nombre_empresa,
                   p.precio + (p.precio * 0.10) AS precio_final, p.imagen_foto
            FROM productos p
            JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
        `;

        db.query(querySinConversion, (err, productosResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener los productos' });
            }

            res.status(200).json({ productos: productosResult });
        });
    } else {
        // Si se especifica moneda, realizar la conversión
        //SELECT conversion FROM currencyconversion WHERE name=?
        const queryTasaCambio = `
            SELECT conversion AS tasa_cambio FROM currencyconversion 
            WHERE name = '${moneda}'
            Limit 1
        `;

        db.query(queryTasaCambio, (err, tasaCambioResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al obtener la tasa de cambio' });
            }

            if (tasaCambioResult.length === 0 || !tasaCambioResult[0].tasa_cambio) {
                return res.status(404).json({ mensaje: `La moneda "${moneda}" no está soportada.` });
            }

            const tasaCambio = tasaCambioResult[0].tasa_cambio;

            // Consulta para obtener los productos con precios ajustados a la moneda
            const queryProductos = `
                SELECT p.id_producto, p.nombre_producto, p.stock, p.categoria, pr.nombre_empresa,
                       ((p.precio + (p.precio * 0.10)) / ?) AS precio_final, p.imagen_foto
                FROM productos p
                JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
            `;

            db.query(queryProductos, [tasaCambio], (err, productosResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al obtener los productos' });
                }

                res.status(200).json({ productos: productosResult });
            });
        });
    }
});



// Iniciar servidor
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
