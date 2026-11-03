const express = require("express");
const router = express.Router();

const controller = require("./couponsController");

const {
    validateCouponId,
    validateAddCoupon,
    validateCouponCode,
    validateOrderId
} = require("./couponsValidation");

const customerAuth = require("../customer/customerAuthMiddleware.js");
const adminAuth = require("../customer/adminAuthMiddleware.js");

// Public: Active coupons
router.get("/active", controller.getActiveCoupons);

// Customer: Validate coupon
router.post(
    "/validate",
    customerAuth,
    validateCouponCode,
    controller.validateCoupon
);

// Customer: Apply coupon to an existing order
router.post(
    "/apply",
    customerAuth,
    validateCouponCode,
    validateOrderId,
    controller.applyCouponToOrder
);

// Admin: Add coupon
router.post(
    "/",
    adminAuth,
    validateAddCoupon,
    controller.addCoupon
);

// Admin: Get all coupons
router.get(
    "/admin/all",
    adminAuth,
    controller.getAllCoupons
);

// Admin: Get coupon by ID
router.get(
    "/admin/:couponId",
    adminAuth,
    validateCouponId,
    controller.getCouponById
);

// Admin: Update coupon
router.put(
    "/:couponId",
    adminAuth,
    validateCouponId,
    validateAddCoupon,
    controller.updateCoupon
);

// Admin: Get usage history
router.get(
    "/admin/:couponId/usage",
    adminAuth,
    validateCouponId,
    controller.getCouponUsage
);

// Admin: Activate coupon
router.patch(
    "/:couponId/activate",
    adminAuth,
    validateCouponId,
    controller.activateCoupon
);

// Admin: Deactivate coupon
router.patch(
    "/:couponId/deactivate",
    adminAuth,
    validateCouponId,
    controller.deactivateCoupon
);

// Admin: Delete coupon
router.delete(
    "/:couponId",
    adminAuth,
    validateCouponId,
    controller.deleteCoupon
);

module.exports = router;