const service = require("./couponsService");

const handleError = (res, error) => {
    console.error("Coupon Error:", error);

    if (error.message === "Unauthorized access.") {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Admin access required.") {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("greater") ||
        error.message.includes("cannot") ||
        error.message.includes("must") ||
        error.message.includes("not found") ||
        error.message.includes("maximum") ||
        error.message.includes("exceed")
    ) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.number >= 50001 && error.number <= 50044) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};

// 1. Add Coupon
const addCoupon = async (req, res) => {
    try {
        const data = await service.addCoupon(req.user, req.body);

        return res.status(201).json({
            success: true,
            message: "Coupon created successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 2. Update Coupon
const updateCoupon = async (req, res) => {
    try {
        const data = await service.updateCoupon(
            req.user,
            Number(req.params.couponId),
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Coupon updated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 3. Get All Coupons
const getAllCoupons = async (req, res) => {
    try {
        const data = await service.getAllCoupons(req.user);

        return res.status(200).json({
            success: true,
            message: "Coupons fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 4. Get Coupon By ID
const getCouponById = async (req, res) => {
    try {
        const data = await service.getCouponById(
            req.user,
            Number(req.params.couponId)
        );

        return res.status(200).json({
            success: true,
            message: "Coupon fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 5. Get Active Coupons
const getActiveCoupons = async (req, res) => {
    try {
        const data = await service.getActiveCoupons();

        return res.status(200).json({
            success: true,
            message: "Active coupons fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 6. Validate Coupon
const validateCoupon = async (req, res) => {
    try {
        const data = await service.validateCoupon(req.user, req.body);

        return res.status(200).json({
            success: true,
            message: "Coupon is valid.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 7. Apply Coupon To Order
const applyCouponToOrder = async (req, res) => {
    try {
        const data = await service.applyCouponToOrder(
            req.user,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 8. Activate Coupon
const activateCoupon = async (req, res) => {
    try {
        const data = await service.activateCoupon(
            req.user,
            Number(req.params.couponId)
        );

        return res.status(200).json({
            success: true,
            message: "Coupon activated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 9. Deactivate Coupon
const deactivateCoupon = async (req, res) => {
    try {
        const data = await service.deactivateCoupon(
            req.user,
            Number(req.params.couponId)
        );

        return res.status(200).json({
            success: true,
            message: "Coupon deactivated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 10. Get Usage History
const getCouponUsage = async (req, res) => {
    try {
        const data = await service.getCouponUsage(
            req.user,
            Number(req.params.couponId)
        );

        return res.status(200).json({
            success: true,
            message: "Coupon usage history fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 11. Delete Coupon
const deleteCoupon = async (req, res) => {
    try {
        const data = await service.deleteCoupon(
            req.user,
            Number(req.params.couponId)
        );

        return res.status(200).json({
            success: true,
            message: "Coupon deleted successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    addCoupon,
    updateCoupon,
    getAllCoupons,
    getCouponById,
    getActiveCoupons,
    validateCoupon,
    applyCouponToOrder,
    activateCoupon,
    deactivateCoupon,
    getCouponUsage,
    deleteCoupon
};