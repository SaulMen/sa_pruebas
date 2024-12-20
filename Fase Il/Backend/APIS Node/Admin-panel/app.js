const express = require('express');
const app = express();
const currencyController = require('./currency/currencyController');
const CurrencyService = require('./currency/currencyService');
const UserController = require('./user/userController');
const CuponController = require('./cupones/couponController');
const cors = require('cors');

app.use(cors({
    origin: '*',
}));

app.use(express.json());

app.use('/admin-panel/currency', currencyController);
app.use('/admin-panel/user', UserController);
app.use('/admin-panel/cupon', CuponController);

(async () => {
    try {
        await CurrencyService.insertInitCurrency();
    } catch (error) {
        console.error("Error al inicializar monedas:", error.message);
    }
})();

module.exports = app; 
