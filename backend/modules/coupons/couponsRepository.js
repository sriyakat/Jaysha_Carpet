const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// Common SP request parameters
const createRequest = async (action) => {
    const pool = await poolPromise;

    return pool.request()
        .input("Action", sql.NVarChar(30), action);
};


// Common coupon parameters
const addCouponParameters = (request, data) => {
    return request
        .input("CouponCode", sql.NVarChar(50), data.couponCode || null)
        .input("Description", sql.NVarChar(250), data.description || null)
        .input("DiscountType", sql.NVarChar(20), data.discountType || null)
        .input("DiscountValue", sql.Decimal(12, 2), data.discountValue ?? null)
        .input("MaxDiscountAmount", sql.Decimal(12, 2), data.maxDiscountAmount ?? null)
        .input("MinOrderAmount", sql.Decimal(12, 2), data.minOrderAmount ?? 0)
        .input("StartDate", sql.DateTime2, data.startDate || null)
        .input("EndDate", sql.DateTime2, data.endDate || null)
        .input("UsageLimit", sql.Int, data.usageLimit ?? null)
        .input("UsagePerCustomer", sql.Int, data.usagePerCustomer ?? 1)
        .input("IsActive", sql.Bit, data.isActive ?? true);
};

// 1. Add Coupon
const addCoupon = async (data) => {
    let request = await createRequest("ADD");
    request = addCouponParameters(request, data);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 2. Update Coupon
const updateCoupon = async (couponId, data) => {
    let request = await createRequest("UPDATE");

    request.input("CouponId", sql.Int, couponId);
    request = addCouponParameters(request, data);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 3. Get All Coupons
const getAllCoupons = async () => {
    const request = await createRequest("GET_ALL");
    const result = await request.execute("sp_ManageCoupons");

    return result.recordset;
};

// 4. Get Coupon By ID
const getCouponById = async (couponId) => {
    const request = await createRequest("GET_BY_ID");

    request.input("CouponId", sql.Int, couponId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0] || null;
};

// 5. Get Active Coupons
const getActiveCoupons = async () => {
    const request = await createRequest("GET_ACTIVE");
    const result = await request.execute("sp_ManageCoupons");

    return result.recordset;
};

// 6. Validate Coupon
const validateCoupon = async (data) => {
    const request = await createRequest("VALIDATE");

    request
        .input("CouponCode", sql.NVarChar(50), data.couponCode)
        .input("CustomerId", sql.Int, data.customerId)
        .input("OrderAmount", sql.Decimal(12, 2), data.orderAmount);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 7. Apply Coupon To Order
const applyCouponToOrder = async (data) => {
    const request = await createRequest("APPLY_TO_ORDER");

    request
        .input("CouponCode", sql.NVarChar(50), data.couponCode)
        .input("CustomerId", sql.Int, data.customerId)
        .input("OrderId", sql.BigInt, data.orderId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 8. Activate Coupon
const activateCoupon = async (couponId) => {
    const request = await createRequest("ACTIVATE");

    request.input("CouponId", sql.Int, couponId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 9. Deactivate Coupon
const deactivateCoupon = async (couponId) => {
    const request = await createRequest("DEACTIVATE");

    request.input("CouponId", sql.Int, couponId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
};

// 10. Get Coupon Usage
const getCouponUsage = async (couponId) => {
    const request = await createRequest("GET_USAGE");

    request.input("CouponId", sql.Int, couponId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset;
};

// 11. Delete Coupon
const deleteCoupon = async (couponId) => {
    const request = await createRequest("DELETE");

    request.input("CouponId", sql.Int, couponId);

    const result = await request.execute("sp_ManageCoupons");
    return result.recordset[0];
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