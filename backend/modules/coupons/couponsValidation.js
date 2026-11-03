const validateCouponId = (req, res, next) => {
    const couponId = Number(req.params.couponId);

    if (!Number.isInteger(couponId) || couponId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid CouponId is required."
        });
    }

    next();
};

const validateAddCoupon = (req, res, next) => {
    const {
        couponCode,
        discountType,
        discountValue,
        startDate,
        endDate
    } = req.body;

    if (!couponCode || !couponCode.trim()) {
        return res.status(400).json({
            success: false,
            message: "Coupon code is required."
        });
    }

    if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
        return res.status(400).json({
            success: false,
            message: "DiscountType must be PERCENTAGE or FIXED."
        });
    }

    if (
        discountValue === undefined ||
        !Number.isFinite(Number(discountValue)) ||
        Number(discountValue) <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid DiscountValue is required."
        });
    }

    if (!startDate || !endDate ||
        isNaN(Date.parse(startDate)) ||
        isNaN(Date.parse(endDate)) ||
        new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
            success: false,
            message: "Valid startDate and endDate are required."
        });
    }

    next();
};

const validateCouponCode = (req, res, next) => {
    if (
        !req.body.couponCode ||
        !req.body.couponCode.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "CouponCode is required."
        });
    }

    next();
};

const validateOrderId = (req, res, next) => {
    const orderId = Number(req.body.orderId);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid OrderId is required."
        });
    }

    next();
};

module.exports = {
    validateCouponId,
    validateAddCoupon,
    validateCouponCode,
    validateOrderId
};