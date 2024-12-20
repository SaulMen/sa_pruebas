const express = require('express');
const router = express.Router();
const CouponService = require('./couponService');

router.post('/', async (req, res) => {
    try {
        const coupon = await CouponService.createCoupon(req.body);
        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const coupons = await CouponService.getAllCoupons();
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const coupon = await CouponService.getCouponById(req.params.id);
        res.json(coupon);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const updatedCoupon = await CouponService.updateCoupon(req.params.id, req.body);
        res.json(updatedCoupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await CouponService.deleteCoupon(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
