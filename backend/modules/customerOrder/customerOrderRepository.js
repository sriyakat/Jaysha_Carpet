
const { poolPromise, sql } = require("../../config/db");

// 1. CREATE ORDER
const createOrder = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CREATE")
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("AddressId", sql.Int, data.AddressId)
        .input("CartId", sql.Int, data.CartId)
        .input("PaymentMethod", sql.NVarChar(30), data.PaymentMethod)
        .input("ShippingCharges", sql.Decimal(12, 2), data.ShippingCharges)
        .input("TaxAmount", sql.Decimal(12, 2), data.TaxAmount)
        .input("CustomerNotes", sql.NVarChar(500), data.CustomerNotes || null)
        .execute("dbo.sp_ManageOrders");

    return {
        order: result.recordsets?.[0]?.[0] || null,
        items: result.recordsets?.[1] || []
    };
};


// 2. GET CUSTOMER ORDERS
const getMyOrders = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_MY_ORDERS")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageOrders");

    return result.recordset;
};


// 3. GET ORDER BY ID
const getOrderById = async (customerId, orderId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("CustomerId", sql.Int, customerId)
        .input("OrderId", sql.BigInt, orderId)
        .execute("dbo.sp_ManageOrders");

    return {
        order: result.recordsets?.[0]?.[0] || null,
        items: result.recordsets?.[1] || []
    };
};


// 4. GET ALL ORDERS (ADMIN)
const getAllOrders = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .execute("dbo.sp_ManageOrders");

    return result.recordset;
};


// 5. UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_STATUS")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("OrderStatus", sql.NVarChar(30), data.OrderStatus)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 6. UPDATE PAYMENT STATUS (ADMIN/SYSTEM)
const updatePaymentStatus = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_PAYMENT")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("PaymentStatus", sql.NVarChar(30), data.PaymentStatus)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 7. UPDATE TRACKING NUMBER (ADMIN)
const updateTrackingNumber = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_TRACKING")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("TrackingNumber", sql.NVarChar(100), data.TrackingNumber)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 8. CANCEL CUSTOMER ORDER
const cancelOrder = async (customerId, orderId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CANCEL")
        .input("CustomerId", sql.Int, customerId)
        .input("OrderId", sql.BigInt, orderId)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 9. GET ORDER ITEMS
const getOrderItems = async (orderId, customerId = null) => {
    const pool = await poolPromise;

    const request = pool.request()
        .input("Action", sql.NVarChar(30), "GET_ORDER_ITEMS")
        .input("OrderId", sql.BigInt, orderId);

    if (customerId !== null) {
        request.input("CustomerId", sql.Int, customerId);
    }

    const result = await request.execute("dbo.sp_ManageOrders");

    return result.recordset;
};


module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateTrackingNumber,
    cancelOrder,
    getOrderItems
};
