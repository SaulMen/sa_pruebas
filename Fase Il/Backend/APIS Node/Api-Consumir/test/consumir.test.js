const request = require('supertest');
const db = require('../db'); 
const axios = require('axios'); 
const { app, insertarProducto, obtenerProductosDeAPI, procesarProductosExternos } = require('../server'); 

jest.mock('axios'); 
jest.mock('../db'); 


describe('Pruebas de API y procesamiento de productos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Endpoint GET /api-consumir/productos
    it('Debe devolver productos desde la base de datos', async () => {
        const mockProductos = [
            { sku: 1, img: 'url1', nombre: 'Producto 1', precio: 100, stock: 10, categoria: 'Categoria 1' },
            { sku: 2, img: 'url2', nombre: 'Producto 2', precio: 200, stock: 20, categoria: 'Categoria 2' },
        ];

        db.query.mockImplementation((query, callback) => callback(null, mockProductos));

        const response = await request(app).get('/api-consumir/productos');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            numgrupo: 18,
            productos: mockProductos,
        });
    });

    it('Debe manejar error al obtener productos de la base de datos', async () => {
        db.query.mockImplementation((query, callback) => callback(new Error('Error DB')));

        const response = await request(app).get('/api-consumir/productos');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Error al obtener los productos');
    });

    // Función obtenerProductosDeAPI
    it('Debe obtener productos desde una API externa', async () => {
        const mockApiResponse = {
            data: { productos: [{ nombre: 'Producto API', precio: 150, stock: 30 }] },
        };

        axios.get.mockResolvedValue(mockApiResponse);

        const result = await obtenerProductosDeAPI('http://api.com/productos');
        expect(result).toEqual(mockApiResponse.data.productos);
    });

    it('Debe manejar error al obtener productos de una API externa', async () => {
        axios.get.mockRejectedValue(new Error('API Error'));

        await expect(obtenerProductosDeAPI('http://api.com/productos')).rejects.toThrow(
            'Error al obtener productos de http://api.com/productos: API Error'
        );
    });

    // Función insertarProducto
    it('Debe insertar un producto en la base de datos', async () => {
        db.query.mockImplementationOnce((query, params, callback) => callback(null, [])); // Producto no existe
        db.query.mockImplementationOnce((query, params, callback) => callback(null, { insertId: 1 })); // Inserta producto

        const producto = { nombre: 'Nuevo Producto', precio: 200, stock: 50 };

        const result = await insertarProducto(producto);
        expect(result).toBe('Producto insertado correctamente.');
    });

    it('Debe rechazar producto con datos faltantes', async () => {
        const productoIncompleto = { precio: 200 }; // Falta nombre y stock
        await expect(insertarProducto(productoIncompleto)).rejects.toBe(
            'Producto con datos faltantes: nombre, precio o stock.'
        );
    });

    it('Debe manejar producto existente en la base de datos', async () => {
        db.query.mockImplementationOnce((query, params, callback) => callback(null, [{ id: 1 }]));

        const producto = { nombre: 'Producto Existente', precio: 200, stock: 50 };
        const result = await insertarProducto(producto);
        expect(result).toBe('El producto ya existe.');
    });

    // Endpoint POST /api-consumir/procesar-productos
    it('Debe procesar productos desde una URL externa correctamente', async () => {
        const mockApiResponse = {
            data: { productos: [{ nombre: 'Producto API', precio: 150, stock: 30 }] },
        };

        axios.get.mockResolvedValue(mockApiResponse);
        db.query.mockImplementation((query, params, callback) => callback(null, [])); // Producto no existe
        db.query.mockImplementation((query, params, callback) => callback(null, { insertId: 1 })); // Inserta producto

        const response = await request(app)
            .post('/api-consumir/procesar-productos')
            .send({ url: 'http://api.com/productos' });

        expect(response.status).toBe(200);
        expect(response.body.mensaje).toBe('Productos procesados correctamente desde la API externa.');
    });

    it('Debe manejar error si no se proporciona URL', async () => {
        const response = await request(app).post('/api-consumir/procesar-productos').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('La URL de la API externa es requerida.');
    });

    it('Debe manejar error al procesar productos desde una API externa', async () => {
        axios.get.mockRejectedValue(new Error('API Error'));

        const response = await request(app)
            .post('/api-consumir/procesar-productos')
            .send({ url: 'http://api.com/productos' });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error al procesar productos');
    });
});

