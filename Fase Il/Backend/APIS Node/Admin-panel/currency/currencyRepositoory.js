const db = require('../db');

class CurrencyRepository {
    createCurrency(currency) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO CurrencyConversion (name,simbolo,conversion,codigo) VALUES (?, ?, ?,?)`;
            db.execute(query, [currency.name, currency.simbolo, currency.conversion, currency.codigo], (err, result) => {
                if (err) reject(err);

                resolve({  ...currency });
            });
        });
    }

    findCurrencyById(currencyId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM CurrencyConversion WHERE id_currency = ?`;
            db.execute(query, [currencyId], (err, rows) => {
                if (err) reject(err);
                resolve(rows[0] || null);
            });
        });
    }

    updateCurrency(currency) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE CurrencyConversion SET name = ?, simbolo = ?, conversion = ?, codigo = ? WHERE id_currency = ?`;
            db.execute(query, [currency.name, currency.simbolo, currency.conversion,currency.codigo, currency.id_currency], (err) => {
                if (err) reject(err);
                resolve(currency);
            });
        });
    }

    findAll() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM CurrencyConversion `;
            db.execute(query, [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
    
    deleteCurrency(id) {
        return new Promise((resolve, reject) => {
            const query = "DELETE FROM CurrencyConversion WHERE id_currency = ?";
            
            db.execute(query, [id], (error, result) => {
                if (error) 
                    return reject(error);
    
                if (result.affectedRows === 0) 
                    return reject(new Error(`No se encontró una moneda con id_currency = ${id}`));
    
                resolve({ message: "Moneda eliminada correctamente", affectedRows: result.affectedRows });
            });
        });
    }
    
}

module.exports = new CurrencyRepository();
