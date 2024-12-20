const soap = require('soap');
const db = require('../db'); 

const WSDL_URL = 'https://banguat.gob.gt/variables/ws/TipoCambio.asmx?WSDL';
                 

async function obtenerTipoCambio(currency) {
    currency = currency + "";
    const codigoMoneda = currency.trim().toUpperCase();
    console.log("currency ", currency)
    if (!codigoMoneda) {
        throw new Error('Código de moneda inválido.');
    }

    try {
        const fechaActual = new Date()
            .toLocaleDateString('es-GT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            });

        const client = await soap.createClientAsync(WSDL_URL);
        const args = { fechainit: fechaActual, moneda: codigoMoneda };

        const [result] = await client.TipoCambioFechaInicialMonedaAsync(args);
        const tipoCambioData = result?.TipoCambioFechaInicialMonedaResult?.Vars?.Var;

        if (!tipoCambioData || tipoCambioData.length === 0) {
            return parseFloat(1.0) 
            //throw new Error('No se encontró el tipo de cambio para la fecha especificada.');
        }
        const { venta } = tipoCambioData[0];
        return parseFloat(venta);

    } catch (error) {
        throw new Error(`Error al consultar el tipo de cambio: ${error.message}`);
    }
}


async function obtenerVariablesDisponibles() {
    try {
        const client = await soap.createClientAsync(WSDL_URL);

        const [result] = await client.VariablesDisponiblesAsync();

        const variablesData = result?.VariablesDisponiblesResult?.Variables?.Variable;

        if (!variablesData || variablesData.length === 0) {
            throw new Error('No se encontraron variables disponibles.');
        }

        const variablesDisponibles = variablesData.map(variable => ({
            codigo: variable.moneda,
            nombre: variable.descripcion
        }));

        return variablesDisponibles;

    } catch (error) {
        throw new Error(`Error al consultar las variables disponibles: ${error.message}`);
    }
}


module.exports = {
    obtenerTipoCambio,
    obtenerVariablesDisponibles
};