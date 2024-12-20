const express = require('express');
const router = express.Router();
const CurrencyService = require('./currencyService.js');

const { obtenerTipoCambio, obtenerVariablesDisponibles } = require('./exchangeService');

router.get('/precreate', async (req, res) => {
  try {
    const variables = await obtenerVariablesDisponibles();
    res.status(200).json(variables); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/create', async (req, res) => {
    const {  name, simbolo, codigo,conversion } = req.body;
    console.log(req.body)
    try {

        let valueBanguat = await obtenerTipoCambio(codigo);
        //Agregue esta parte para que conversion sea opcional
        if(conversion ){
            valueBanguat = conversion
        }
        const newCurrency = await CurrencyService.createCurrency( name, simbolo, valueBanguat,codigo);
        res.status(201).json(newCurrency);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const currency = await CurrencyService.findCurrencyById(id);
        res.json(currency);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    console.log("put", id)
    try {
      const { name, simbolo, codigo } = req.body;
      const variables = await obtenerTipoCambio(codigo);
      console.log("--> ",variables)
      const updatedCurrency = await CurrencyService.updateCurrency(id, name, simbolo,codigo,variables);
      
      res.json(updatedCurrency);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});

router.get('/', async (req, res) => {
    try {
        const currencies = await CurrencyService.getAll();
        res.json(currencies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await CurrencyService.deleteCurrency(id);
        res.json({ message: "Currency deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

