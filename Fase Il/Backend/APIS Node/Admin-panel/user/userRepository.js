const db = require('../db');

class UserRepository {
    createUser(user) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO usuarios (nombre, email, contraseña, celular, tipo_usuario, rol) VALUES (?, ?, ?, ?, ?, ?)`;
            db.execute(query, [user.nombre, user.email, user.contraseña, user.celular, user.tipo_usuario, user.rol], (err, result) => {
                if (err) return reject(err);
                resolve({ id_usuario: result.insertId, ...user });
            });
        });
    }

    findUserById(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM usuarios WHERE id_usuario = ?`;
            db.execute(query, [id], (err, rows) => {
                if (err) return reject(err);
                resolve(rows[0] || null);
            });
        });
    }

    updateUser(id, user) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE usuarios SET nombre = ?, email = ?, contraseña = ?, celular = ?, tipo_usuario = ?, rol = ? WHERE id_usuario = ?`;
            db.execute(query, [user.nombre, user.email, user.contraseña, user.celular, user.tipo_usuario, user.rol, id], (err) => {
                if (err) return reject(err);
                resolve({ id_usuario: id, ...user });
            });
        });
    }

    deleteUser(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM usuarios WHERE id_usuario = ?`;
            db.execute(query, [id], (err) => {
                if (err) return reject(err);
                resolve({ message: "Usuario eliminado correctamente" });
            });
        });
    }

    findAllUsers() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM usuarios`;
            db.execute(query, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = new UserRepository();
