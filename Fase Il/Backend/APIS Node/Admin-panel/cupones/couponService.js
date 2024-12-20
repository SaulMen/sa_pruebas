const CouponRepository = require('./couponRepository');

class CouponService {
    async createCoupon(data) {
        return await CouponRepository.createCoupon(data);
    }

    async updateCoupon(id, data) {
        const coupon = await CouponRepository.findCouponById(id);
        if (!coupon) throw new Error("Cupón no encontrado");
        return await CouponRepository.updateCoupon(id, data);
    }

    async deleteCoupon(id) {
        const coupon = await CouponRepository.findCouponById(id);
        if (!coupon) throw new Error("Cupón no encontrado");
        return await CouponRepository.deleteCoupon(id);
    }

    async getCouponById(id) {
        const coupon = await CouponRepository.findCouponById(id);
        if (!coupon) throw new Error("Cupón no encontrado");
        return coupon;
    }

    async getAllCoupons() {
        return await CouponRepository.findAllCoupons();
    }
}

module.exports = new CouponService();
