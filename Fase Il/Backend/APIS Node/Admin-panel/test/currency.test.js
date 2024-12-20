const request = require('supertest');
const app = require('../app'); 
const CurrencyService = require('../currency/currencyService');
const { obtenerTipoCambio, obtenerVariablesDisponibles } = require('../currency/exchangeService');

// Mockear servicios externos
jest.mock('../currency/exchangeService');
jest.mock('../currency/currencyService');

describe('Pruebas unitarias para Currency Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCurrency = { id: 1, name: 'USD', simbolo: '$', codigo: '2', conversion: 7.75 };
  const mockVariables = [{ codigo: '2', descripcion: 'Dólares' }, { codigo: 'Y', descripcion: 'Yenes' }];

  // Prueba para GET /precreate
  it('Debe obtener las variables disponibles del Banguat', async () => {
    obtenerVariablesDisponibles.mockResolvedValue(mockVariables);

    const response = await request(app).get('/admin-panel/currency/precreate');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockVariables);
    expect(obtenerVariablesDisponibles).toHaveBeenCalled();
  });

  // Prueba para POST /create
  it('Debe crear una nueva moneda con conversión del Banguat', async () => {
    obtenerTipoCambio.mockResolvedValue(7.75);
    CurrencyService.createCurrency.mockResolvedValue(mockCurrency);

    const response = await request(app)
      .post('/admin-panel/currency/create')
      .send({ name: 'USD', simbolo: '$', codigo: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(mockCurrency);
    expect(obtenerTipoCambio).toHaveBeenCalledWith(2);
    expect(CurrencyService.createCurrency).toHaveBeenCalledWith('USD', '$', 7.75, 2);
  })

  // Prueba para GET /:id
  it('Debe obtener una moneda por ID', async () => {
    CurrencyService.findCurrencyById.mockResolvedValue(mockCurrency);

    const response = await request(app).get('/admin-panel/currency/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCurrency);
    expect(CurrencyService.findCurrencyById).toHaveBeenCalledWith('1');
  });

  // Prueba para PUT /:id
  it('Debe actualizar una moneda con conversión del Banguat', async () => {
    obtenerTipoCambio.mockResolvedValue(7.75);
    const updatedCurrency = { ...mockCurrency, conversion: 7.75 };
    CurrencyService.updateCurrency.mockResolvedValue(updatedCurrency);

    const response = await request(app)
      .put('/admin-panel/currency/1')
      .send({ name: 'USD Updated', simbolo: '$', codigo: 2 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedCurrency);
    expect(obtenerTipoCambio).toHaveBeenCalledWith(2);
    expect(CurrencyService.updateCurrency).toHaveBeenCalledWith('1', 'USD Updated', '$', 2, 7.75);
  });

  // Prueba para GET /
  it('Debe devolver todas las monedas', async () => {
    const mockCurrencies = [mockCurrency];
    CurrencyService.getAll.mockResolvedValue(mockCurrencies);

    const response = await request(app).get('/admin-panel/currency');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockCurrencies);
    expect(CurrencyService.getAll).toHaveBeenCalled();
  });

  // Prueba para DELETE /:id
  it('Debe eliminar una moneda por ID', async () => {
    CurrencyService.deleteCurrency.mockResolvedValue({ message: 'Currency deleted successfully' });

    const response = await request(app).delete('/admin-panel/currency/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Currency deleted successfully' });
    expect(CurrencyService.deleteCurrency).toHaveBeenCalledWith('1');
  });

  // Prueba de manejo de errores
  it('Debe manejar errores al fallar una solicitud', async () => {
    obtenerVariablesDisponibles.mockRejectedValue(new Error('Error interno'));

    const response = await request(app).get('/admin-panel/currency/precreate');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Error interno' });
  });
});
