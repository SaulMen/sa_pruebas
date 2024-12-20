
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


// Endpoint para registrar clientes
app.post('/autenticacion/registro-cliente', (req, res) => {
    const { nombre, email, contraseña, celular, nombre_completo } = req.body;

    // Verificaremos si el email ya está registrado
    const queryEmailExistente = `SELECT * FROM usuarios WHERE email = ?`;
    db.query(queryEmailExistente, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al verificar el email' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        bcrypt.hash(contraseña, 10, (err, hashpass) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al encriptar la contraseña' });
            }

            // Insertar datos en la tabla usuarios
            const queryUsuario = `
                INSERT INTO usuarios (nombre, email, contraseña, celular, tipo_usuario)
                VALUES (?, ?, ?, ?, 'cliente')`;

            db.query(queryUsuario, [nombre, email, hashpass, celular], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }

                // Insertar datos en la tabla clientes
                const idUsuario = result.insertId;
                const queryCliente = `
                    INSERT INTO clientes (id_cliente, nombre_completo)
                    VALUES (?, ?)`;

                db.query(queryCliente, [idUsuario, nombre_completo], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error al registrar el cliente' });
                    }

                    res.status(201).json({ mensaje: 'Cliente registrado con éxito' });
                });
            });
        });
    });
});

// Endpoint para registrar proveedores
app.post('/autenticacion/registro-proveedor', (req, res) => {
    const { nombre, email, contraseña, celular, nombre_empresa, direccion_fisica } = req.body;

    // Verificaremos si el email ya está registrado
    const queryEmailExistente = `SELECT * FROM usuarios WHERE email = ?`;
    db.query(queryEmailExistente, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al verificar el email' });
        }

        if (result.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        bcrypt.hash(contraseña, 10, (err, hashpass) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al encriptar la contraseña' });
            }

            // Insertar datos en la tabla usuarios
            const queryUsuario = `
                INSERT INTO usuarios (nombre, email, contraseña, celular, tipo_usuario)
                VALUES (?, ?, ?, ?, 'proveedor')`;

            db.query(queryUsuario, [nombre, email, hashpass, celular], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }

                // Insertar datos en la tabla proveedores
                const idUsuario = result.insertId;
                const queryProveedor = `
                    INSERT INTO proveedores (id_proveedor, nombre_empresa, direccion_fisica)
                    VALUES (?, ?, ?)`;

                db.query(queryProveedor, [idUsuario, nombre_empresa, direccion_fisica], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: 'Error al registrar el proveedor' });
                    }

                    res.status(201).json({ mensaje: 'Proveedor registrado con éxito' });
                });
            });
        });
    });
});


// Endpoint de inicio de sesión
app.post('/autenticacion/login', (req, res) => {
    const { email, contraseña } = req.body;

    // Buscar usuario por email
    const query = `Select * from usuarios where email = ?`;
    db.query(query, [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }

        if (result.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const usuario = result[0];

        bcrypt.compare(contraseña, usuario.contraseña, (err, iguales) => {

            console.log(contraseña, usuario.contraseña);
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al comparar contraseñas' });
            }

            if (!iguales) {
                return res.status(401).json({ error: 'Contraseña incorrecta' });
            }

            // Crear token
            const payload = {
                id_usuario: usuario.id_usuario,
                tipo_usuario: usuario.tipo_usuario
            };

            // Generar token con vigencia de siete días
            const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });

            // Devolver token al usuario
            res.status(200).json({mensaje: 'Inicio de sesión exitoso', id:usuario.id_usuario,token});
        });
    });
});

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
