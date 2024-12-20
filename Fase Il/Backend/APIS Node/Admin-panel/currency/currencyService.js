const CurrencyRepository = require('./currencyRepositoory');
const { obtenerTipoCambio } = require('./exchangeService'); 

class CurrencyService {
    
    async createCurrency( name, simbolo, conversion, codigo) {
        const currency = {
            name: name,
            simbolo: simbolo,
            conversion: conversion,
            codigo: codigo
        };
        return await CurrencyRepository.createCurrency(currency);
    }

    async findCurrencyById(currencyId) {
        const currency = await CurrencyRepository.findCurrencyById(currencyId);
        if (!currency) throw new Error('Currency not found');

        currency.return_date = new Date();
        return await CurrencyRepository.updateCurrency(currency);
    }

    async updateCurrency(id_currency, name, simbolo,codigo,conversion){
        const currency = {
            id_currency: Number(id_currency),
            name: name,
            simbolo: simbolo,
            codigo: codigo,
            conversion: conversion
        };
        return await CurrencyRepository.updateCurrency(currency)
    }

    async getAll() {
        return await CurrencyRepository.findAll();
    }

    async deleteCurrency(id){
        return await CurrencyRepository.deleteCurrency(id);
    }

    async insertInitCurrency() {
        try {
            const currencyLst = await this.getAll(); 
    
            if (currencyLst && currencyLst.length > 0) {
                for (const element of currencyLst) {
                    await this.updateCurrency(
                        element.id_currency,
                        element.name,
                        element.simbolo,
                        element.codigo,
                        element.conversion
                    );
                }
                return; 
            }
    
            console.log("Insertando monedas iniciales...");
    
            const usd = await obtenerTipoCambio('2');
            const mxn = await obtenerTipoCambio('18');
            const jpy = await obtenerTipoCambio('3');
    
            await this.createCurrency(1, "Dolar", "$$", usd, 2);
            await this.createCurrency(2, "MXN", "$", mxn, 18);
            await this.createCurrency(3, "JPY", "JPY", jpy, 3);
    
        } catch (error) {
            console.error(`Error al obtener o insertar los tipos de cambio: ${error.message}`);
        }
    }
    
}

module.exports = new CurrencyService();
