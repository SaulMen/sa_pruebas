const request = require('supertest');
const app = require('../app'); 
const CouponService = require('../cupones/couponService'); 

// Mockear el CouponService
jest.mock('../cupones/couponService');

describe('Pruebas para el CRUD de Coupons', () => {
    const mockCoupon = { id: 1, codigo: 'TEST2024', descuento: 10 };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Prueba de POST 
    it('Debe crear un cupón y devolver status 201', async () => {
        CouponService.createCoupon.mockResolvedValue(mockCoupon);

        const response = await request(app)
            .post('/admin-panel/cupon')
            .send({ codigo: 'TEST2024', descuento: 10 });

        expect(response.status).toBe(201);
        expect(response.body).toEqual(mockCoupon);
        expect(CouponService.createCoupon).toHaveBeenCalledWith({ codigo: 'TEST2024', descuento: 10 });
    });

    // Prueba de GET /
    it('Debe devolver todos los cupones', async () => {
        const mockCoupons = [mockCoupon];
        CouponService.getAllCoupons.mockResolvedValue(mockCoupons);

        const response = await request(app).get('/admin-panel/cupon');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCoupons);
        expect(CouponService.getAllCoupons).toHaveBeenCalled();
    });

    // Prueba de GET /:id
    it('Debe devolver un cupón por ID', async () => {
        CouponService.getCouponById.mockResolvedValue(mockCoupon);

        const response = await request(app).get('/admin-panel/cupon/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCoupon);
        expect(CouponService.getCouponById).toHaveBeenCalledWith('1');
    });

    // Prueba de PUT /:id
    it('Debe actualizar un cupón y devolver el resultado', async () => {
        const updatedCoupon = { id: 1, codigo: 'TEST2024_UPDATED', descuento: 15 };
        CouponService.updateCoupon.mockResolvedValue(updatedCoupon);

        const response = await request(app)
            .put('/admin-panel/cupon/1')
            .send({ codigo: 'TEST2024_UPDATED', descuento: 15 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedCoupon);
        expect(CouponService.updateCoupon).toHaveBeenCalledWith('1', { codigo: 'TEST2024_UPDATED', descuento: 15 });
    });

    // Prueba de DELETE /:id
    it('Debe eliminar un cupón y devolver el resultado', async () => {
        const deleteResult = { message: 'Cupón eliminado exitosamente' };
        CouponService.deleteCoupon.mockResolvedValue(deleteResult);

        const response = await request(app).delete('/admin-panel/cupon/1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(deleteResult);
        expect(CouponService.deleteCoupon).toHaveBeenCalledWith('1');
    });

    // Prueba de manejo de errores
    it('Debe manejar errores del servicio', async () => {
        CouponService.getAllCoupons.mockRejectedValue(new Error('Error interno'));

        const response = await request(app).get('/admin-panel/cupon');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ message: 'Error interno' });
    });
});
