const repository = require("./couponsRepository");
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

const checkAdmin = (user) => {
    if (!user) {
        throw new Error("Unauthorized access.");
    }

    const role = (
        user.RoleName ||
        user.Role ||
        user.roleName ||
        user.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Admin access required.");
    }
};

const getCustomerId = async (user) => {
    if (!user) {
        throw new Error("Unauthorized access.");
    }

    if (user.CustomerId || user.customerId) {
        return Number(user.CustomerId || user.customerId);
    }

    const userId = user.UserId || user.userId || user.id;

    if (!userId) {
        throw new Error("Customer information not found.");
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("UserId", sql.Int, userId)
        .query(`
            SELECT CustomerId
            FROM dbo.Customers
            WHERE UserId = @UserId
        `);

    if (!result.recordset.length) {
        throw new Error("Customer profile not found.");
    }

    return result.recordset[0].CustomerId;
};

const validateCouponData = (data) => {
    if (!data.couponCode || !data.couponCode.trim()) {
        throw new Error("Coupon code is required.");
    }

    if (!["PERCENTAGE", "FIXED"].includes(data.discountType)) {
        throw new Error("Discount type must be PERCENTAGE or FIXED.");
    }

    const discountValue = Number(data.discountValue);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
        throw new Error("Discount value must be greater than zero.");
    }

    if (data.discountType === "PERCENTAGE" && discountValue > 100) {
        throw new Error("Percentage discount cannot exceed 100.");
    }

    const minOrder = Number(data.minOrderAmount ?? 0);

    if (!Number.isFinite(minOrder) || minOrder < 0) {
        throw new Error("Invalid minimum order amount.");
    }

    const perCustomer = Number(data.usagePerCustomer ?? 1);

    if (!Number.isInteger(perCustomer) || perCustomer <= 0) {
        throw new Error("Usage per customer must be greater than zero.");
    }

    if (data.usageLimit !== undefined && data.usageLimit !== null) {
        const limit = Number(data.usageLimit);

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error("Usage limit must be greater than zero.");
        }
    }

    if (
        data.maxDiscountAmount !== undefined &&
        data.maxDiscountAmount !== null
    ) {
        const maxDiscount = Number(data.maxDiscountAmount);

        if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
            throw new Error("Maximum discount must be greater than zero.");
        }
    }

    if (
        !data.startDate ||
        !data.endDate ||
        isNaN(Date.parse(data.startDate)) ||
        isNaN(Date.parse(data.endDate)) ||
        new Date(data.endDate) <= new Date(data.startDate)
    ) {
        throw new Error("Valid coupon start and end dates are required.");
    }
};

// 1. Add Coupon
const addCoupon = async (user, data) => {
    checkAdmin(user);
    validateCouponData(data);

    return await repository.addCoupon(data);
};

// 2. Update Coupon
const updateCoupon = async (user, couponId, data) => {
    checkAdmin(user);

    const existing = await repository.getCouponById(couponId);

    if (!existing) {
        throw new Error("Coupon not found.");
    }

    validateCouponData(data);

    return await repository.updateCoupon(couponId, data);
};

// 3. Get All Coupons
const getAllCoupons = async (user) => {
    checkAdmin(user);
    return await repository.getAllCoupons();
};

// 4. Get Coupon By ID
const getCouponById = async (user, couponId) => {
    checkAdmin(user);

    const coupon = await repository.getCouponById(couponId);

    if (!coupon) {
        throw new Error("Coupon not found.");
    }

    return coupon;
};

// 5. Public Active Coupons
const getActiveCoupons = async () => {
    return await repository.getActiveCoupons();
};

// 6. Validate Coupon For Customer
const validateCoupon = async (user, data) => {
    const customerId = await getCustomerId(user);

    const orderAmount = Number(data.orderAmount);

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
        throw new Error("Valid order amount is required.");
    }

    if (!data.couponCode || !data.couponCode.trim()) {
        throw new Error("Coupon code is required.");
    }

    return await repository.validateCoupon({
        couponCode: data.couponCode.trim(),
        customerId,
        orderAmount
    });
};

// 7. Apply Coupon To Existing Order
const applyCouponToOrder = async (user, data) => {
    const customerId = await getCustomerId(user);

    if (!data.orderId || !Number.isInteger(Number(data.orderId)) ||
        Number(data.orderId) <= 0) {
        throw new Error("Valid OrderId is required.");
    }

    if (!data.couponCode || !data.couponCode.trim()) {
        throw new Error("Coupon code is required.");
    }

    return await repository.applyCouponToOrder({
        couponCode: data.couponCode.trim(),
        customerId,
        orderId: Number(data.orderId)
    });
};

// 8. Activate
const activateCoupon = async (user, couponId) => {
    checkAdmin(user);
    return await repository.activateCoupon(couponId);
};

// 9. Deactivate
const deactivateCoupon = async (user, couponId) => {
    checkAdmin(user);
    return await repository.deactivateCoupon(couponId);
};

// 10. Usage History
const getCouponUsage = async (user, couponId) => {
    checkAdmin(user);
    return await repository.getCouponUsage(couponId);
};

// 11. Delete
const deleteCoupon = async (user, couponId) => {
    checkAdmin(user);
    return await repository.deleteCoupon(couponId);
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