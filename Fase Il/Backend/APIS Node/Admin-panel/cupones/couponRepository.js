const db = require('../db');

class CouponRepository {
    createCoupon(coupon) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO cupones (codigo_cupon, porcentaje_descuento, fecha_vencimiento, usos_totales, usos_por_cliente) VALUES (?, ?, ?, ?, ?)`;
            db.execute(query, [coupon.codigo_cupon, coupon.porcentaje_descuento, coupon.fecha_vencimiento, coupon.usos_totales, coupon.usos_por_cliente], (err, result) => {
                if (err) return reject(err);
                resolve({ id_cupon: result.insertId, ...coupon });
            });
        });
    }

    updateCoupon(id, coupon) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE cupones SET codigo_cupon = ?, porcentaje_descuento = ?, fecha_vencimiento = ?, usos_totales = ?, usos_por_cliente = ? WHERE id_cupon = ?`;
            db.execute(query, [coupon.codigo_cupon, coupon.porcentaje_descuento, coupon.fecha_vencimiento, coupon.usos_totales, coupon.usos_por_cliente, id], (err) => {
                if (err) return reject(err);
                resolve({ id_cupon: id, ...coupon });
            });
        });
    }

    deleteCoupon(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM cupones WHERE id_cupon = ?`;
            db.execute(query, [id], (err) => {
                if (err) return reject(err);
                resolve({ message: "Cupón eliminado correctamente" });
            });
        });
    }

    findCouponById(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM cupones WHERE id_cupon = ?`;
            db.execute(query, [id], (err, rows) => {
                if (err) return reject(err);
                resolve(rows[0] || null);
            });
        });
    }

    findAllCoupons() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM cupones`;
            db.execute(query, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }
}

module.exports = new CouponRepository();
