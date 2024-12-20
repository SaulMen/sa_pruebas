const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Endpoints
app.post('/autenticacion/registro-cliente', (req, res) => {
    const { nombre, email, contraseña, celular, nombre_completo } = req.body;

    const queryEmailExistente = `SELECT * FROM usuarios WHERE email = ?`;
    db.query(queryEmailExistente, [email], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al verificar el email' });
        if (result.length > 0) return res.status(400).json({ error: 'El email ya está registrado' });

        bcrypt.hash(contraseña, 10, (err, hashpass) => {
            if (err) return res.status(500).json({ error: 'Error al encriptar la contraseña' });

            const queryUsuario = `INSERT INTO usuarios (nombre, email, contraseña, celular, tipo_usuario) VALUES (?, ?, ?, ?, 'cliente')`;
            db.query(queryUsuario, [nombre, email, hashpass, celular], (err, result) => {
                if (err) return res.status(500).json({ error: 'Error al registrar el usuario' });

                const idUsuario = result.insertId;
                const queryCliente = `INSERT INTO clientes (id_cliente, nombre_completo) VALUES (?, ?)`;
                db.query(queryCliente, [idUsuario, nombre_completo], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al registrar el cliente' });
                    res.status(201).json({ mensaje: 'Cliente registrado con éxito' });
                });
            });
        });
    });
});


module.exports = app;
