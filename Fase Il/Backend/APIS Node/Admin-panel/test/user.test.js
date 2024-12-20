const request = require('supertest');
const app = require('../app');
const UserService = require('../user/UserService');

// Mockear UserService
jest.mock('../user/UserService');

describe('Pruebas unitarias para User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = {
        id: 1,
        nombre: 'Julio Test',
        email: 'julio@test.com',
        tipo_usuario: 'cliente',
        rol: 'cliente',
        celular: '12345678'
    };

    // Prueba POST /
    it('Debe crear un nuevo usuario y devolver status 201', async () => {
        UserService.createUser.mockResolvedValue(mockUser);

        const response = await request(app)
            .post('/admin-panel/user')
            .send({
                nombre: 'Julio Test',
                email: 'julio@test.com',
                tipo_usuario: 'cliente',
                rol: 'cliente',
                celular: '12345678'
            });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockUser);
        expect(UserService.createUser).toHaveBeenCalledWith({
            nombre: 'Julio Test',
            email: 'julio@test.com',
            tipo_usuario: 'cliente',
            rol: 'cliente',
            celular: '12345678'
        });
    });

    // Prueba GET /
    it('Debe devolver todos los usuarios', async () => {
        const mockUsers = [mockUser];
        UserService.getAllUsers.mockResolvedValue(mockUsers);

        const response = await request(app).get('/admin-panel/user');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUsers);
        expect(UserService.getAllUsers).toHaveBeenCalled();
    });

    // Prueba GET /:id
    it('Debe devolver un usuario por ID', async () => {
        UserService.getUserById.mockResolvedValue(mockUser);

        const response = await request(app).get('/admin-panel/user/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockUser);
        expect(UserService.getUserById).toHaveBeenCalledWith('1');
    });

    // Prueba GET /:id con error
    it('Debe devolver error 404 si el usuario no existe', async () => {
        UserService.getUserById.mockRejectedValue(new Error('Usuario no encontrado'));

        const response = await request(app).get('/admin-panel/user/999');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: 'Usuario no encontrado' });
    });

    // Prueba PUT /:id
    it('Debe actualizar un usuario y devolver el resultado', async () => {
        const updatedUser = { ...mockUser, nombre: 'Julio Actualizado' };
        UserService.updateUser.mockResolvedValue(updatedUser);

        const response = await request(app)
            .put('/admin-panel/user/1')
            .send({ nombre: 'Julio Actualizado' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedUser);
        expect(UserService.updateUser).toHaveBeenCalledWith('1', { nombre: 'Julio Actualizado' });
    });

    // Prueba DELETE /:id
    it('Debe eliminar un usuario y devolver confirmación', async () => {
        UserService.deleteUser.mockResolvedValue({ message: 'Usuario eliminado exitosamente' });

        const response = await request(app).delete('/admin-panel/user/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Usuario eliminado exitosamente' });
        expect(UserService.deleteUser).toHaveBeenCalledWith('1');
    });

    // Prueba de manejo de errores en POST
    it('Debe manejar errores al crear un usuario', async () => {
        UserService.createUser.mockRejectedValue(new Error('Error interno al crear usuario'));

        const response = await request(app)
            .post('/admin-panel/user')
            .send({
                nombre: 'Error User',
                email: 'error@test.com'
            });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Error interno al crear usuario' });
    });
});
