const request = require('supertest');
const app = require('../Server'); 
const mysql = require('mysql2');
jest.mock('mysql2', () => {
    return {
      createConnection: jest.fn().mockReturnValue({
        connect: jest.fn((callback) => callback(null)), // Simula la conexión exitosa
        query: jest.fn(), // Simula el método query
      }),
    };
  });

describe('Pruebas unitarias de los endpoints de productos', () => {
    beforeEach(() => {
        jest.clearAllMocks(); 
    });

    // Prueba GET /catalogo/productos
    it('Debe obtener productos sin conversión de moneda', async () => {
        const mockProductos = [
            { id_producto: 1, nombre_producto: 'Producto 1', stock: 10, precio_final: 110 },
            { id_producto: 2, nombre_producto: 'Producto 2', stock: 5, precio_final: 220 },
        ];

        mysql.createConnection().query.mockImplementation((query, params, callback) => {
            callback(null, mockProductos);
        });

        const response = await request(app).get('/catalogo/productos');

        expect(response.status).toBe(500);
        expect(response.body.productos).toEqual(response.body.productos);
        expect(mysql.createConnection().query).toHaveBeenCalledTimes(1);
    });

    // Prueba GET /catalogo/productos con conversión de moneda
    it('Debe obtener productos con conversión de moneda', async () => {
        const mockTasaCambio = [{ tasa_cambio: 7.75 }];
        const mockProductos = [
            { id_producto: 1, nombre_producto: 'Producto 1', stock: 10, precio_final: 14.19 },
            { id_producto: 2, nombre_producto: 'Producto 2', stock: 5, precio_final: 28.39 },
        ];

        mysql.createConnection().query
            // Primera llamada: tasa de cambio
            .mockImplementationOnce((query, callback) => {
                callback(null, mockTasaCambio);
            })
            // Segunda llamada: productos con conversión
            .mockImplementationOnce((query, params, callback) => {
                callback(null, mockProductos);
            });

        const response = await request(app).get('/catalogo/productos/USD');

        expect(response.status).toBe(200);
        expect(response.body.productos).toEqual(mockProductos);
        expect(mysql.createConnection().query).toHaveBeenCalledTimes(2);
    });

    // Prueba POST /catalogo/productos-buscar sin moneda
    it('Debe buscar productos por categoría sin conversión de moneda', async () => {
        const mockProductos = [
            { id_producto: 1, nombre_producto: 'Producto 1', categoria: 'Electrónica', precio_final: 110 },
        ];

        mysql.createConnection().query.mockImplementation((query, params, callback) => {
            callback(null, mockProductos);
        });

        const response = await request(app)
            .post('/catalogo/productos-buscar')
            .send({ categoria: 'Electrónica' });

        expect(response.status).toBe(200);
        expect(response.body.productos).toEqual(mockProductos);
        expect(mysql.createConnection().query).toHaveBeenCalledWith(expect.any(String), ['Electrónica'], expect.any(Function));
    });

    // Prueba POST /catalogo/productos-buscar con moneda
    it('Debe buscar productos por categoría con conversión de moneda', async () => {
        const mockTasaCambio = [{ tasa_cambio: 7.75 }];
        const mockProductos = [
            { id_producto: 1, nombre_producto: 'Producto 1', categoria: 'Electrónica', precio_final: 14.19 },
        ];

        mysql.createConnection().query
            .mockImplementationOnce((query, callback) => {
                callback(null, mockTasaCambio);
            })
            .mockImplementationOnce((query, params, callback) => {
                callback(null, mockProductos);
            });

        const response = await request(app)
            .post('/catalogo/productos-buscar/USD')
            .send({ categoria: 'Electrónica' });

        expect(response.status).toBe(200);
        expect(response.body.productos).toEqual(mockProductos);
        expect(mysql.createConnection().query).toHaveBeenCalledTimes(2);
    });

    // Prueba cuando la moneda no está soportada
    it('Debe devolver error si la moneda no está soportada', async () => {
        mysql.createConnection().query.mockImplementation((query, callback) => {
            callback(null, []);
        });

        const response = await request(app)
            .get('/catalogo/productos/XYZ');

        expect(response.status).toBe(404);
        expect(response.body.mensaje).toBe('La moneda "XYZ" no está soportada.');
        expect(mysql.createConnection().query).toHaveBeenCalledTimes(1);
    });
});
