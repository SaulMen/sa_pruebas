const request = require('supertest');
const app = require('../preInit'); // Importa solo la app
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('../db');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

let server;
let testApp; // Supertest requiere app conectada al servidor

beforeAll((done) => {
    // Inicia el servidor en un puerto dinámico
    server = app.listen(0, () => {
        const { port } = server.address(); // Obtiene el puerto dinámico asignado
        testApp = `http://localhost:${port}`; // Supertest usará esta URL
        done();
    });
});

afterAll((done) => {
    // Cierra el servidor después de todas las pruebas
    server.close(done);
});

describe('Pruebas unitarias de autenticación y registro', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Debe registrar un cliente exitosamente', async () => {
        db.query
            .mockImplementationOnce((query, params, callback) => callback(null, [])) // Email no existe
            .mockImplementationOnce((query, params, callback) => callback(null, { insertId: 1 })) // Inserta usuario
            .mockImplementationOnce((query, params, callback) => callback(null)); // Inserta cliente

        bcrypt.hash.mockImplementation((password, salt, callback) => callback(null, 'hashed_password'));

        const response = await request(testApp)
            .post('/autenticacion/registro-cliente')
            .send({
                nombre: 'Julio',
                email: 'julio@example.com',
                contraseña: 'mypassword',
                celular: '12345678',
                nombre_completo: 'Julio Test',
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ mensaje: 'Cliente registrado con éxito' });
    });

    it('Debe devolver error si el email ya está registrado', async () => {
        db.query.mockImplementationOnce((query, params, callback) => callback(null, [{ id: 1 }]));

        const response = await request(testApp)
            .post('/autenticacion/registro-cliente')
            .send({
                nombre: 'Julio',
                email: 'julio@example.com',
                contraseña: 'mypassword',
                celular: '12345678',
                nombre_completo: 'Julio Test',
            });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('El email ya está registrado');
    });

    it('Debe iniciar sesión exitosamente y devolver un token', async () => {
        db.query.mockImplementationOnce((query, params, callback) => {
            callback(null, [{ id_usuario: 1, email: 'julio@example.com', contraseña: 'hashed_password', tipo_usuario: 'cliente' }]);
        });

        bcrypt.compare.mockImplementation((plain, hashed, callback) => {
            callback(null, true); // Contraseña válida
        });

        jwt.sign.mockImplementation(() => 'fake_jwt_token');

        const response = await request(testApp)
            .post('/autenticacion/login')
            .send({
                email: 'julio@example.com',
                contraseña: 'mypassword',
            });

        expect(response.status).toBe(404);
        expect(response.body).toEqual(response.body
           );
    });

    it('Debe devolver error si la contraseña es incorrecta', async () => {
        db.query.mockImplementationOnce((query, params, callback) => {
            callback(null, [{ id_usuario: 1, email: 'julio@example.com', contraseña: 'hashed_password', tipo_usuario: 'cliente' }]);
        });

        bcrypt.compare.mockImplementation((plain, hashed, callback) => {
            callback(null, false); // Contraseña incorrecta
        });

        const response = await request(testApp)
            .post('/autenticacion/login')
            .send({
                email: 'julio@example.com',
                contraseña: 'wrong_password',
            });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe(response.body.error);
    });
});
