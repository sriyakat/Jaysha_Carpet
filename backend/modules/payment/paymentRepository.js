// payment.repository.js

const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// CREATE PAYMENT
const createPayment = async (paymentData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "CREATE")
        .input("OrderId", sql.BigInt, paymentData.OrderId)
        .input("PaymentMethod", sql.NVarChar(30), paymentData.PaymentMethod)
        .input("Amount", sql.Decimal(12, 2), paymentData.Amount)
        .execute("sp_ManagePayments");

    return result.recordset[0];
};

// GET PAYMENT BY ID
const getPaymentById = async (paymentId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_BY_ID")
        .input("PaymentId", sql.BigInt, paymentId)
        .execute("sp_ManagePayments");

    return result.recordset[0] || null;
};

// GET PAYMENTS BY ORDER
const getPaymentsByOrder = async (orderId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_BY_ORDER")
        .input("OrderId", sql.BigInt, orderId)
        .execute("sp_ManagePayments");

    return result.recordset;
};

// GET ALL PAYMENTS
const getAllPayments = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_ALL")
        .execute("sp_ManagePayments");

    return result.recordset;
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (paymentData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "UPDATE_STATUS")
        .input("PaymentId", sql.BigInt, paymentData.PaymentId)
        .input("PaymentStatus", sql.NVarChar(30), paymentData.PaymentStatus)
        .execute("sp_ManagePayments");

    return result.recordset[0];
};

// UPDATE GATEWAY DETAILS
const updateGatewayDetails = async (paymentData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "UPDATE_GATEWAY_DETAILS")
        .input("PaymentId", sql.BigInt, paymentData.PaymentId)
        .input("GatewayName", sql.NVarChar(50), paymentData.GatewayName || null)
        .input("GatewayOrderId", sql.NVarChar(150), paymentData.GatewayOrderId || null)
        .input("GatewayPaymentId", sql.NVarChar(150), paymentData.GatewayPaymentId || null)
        .input("GatewaySignature", sql.NVarChar(500), paymentData.GatewaySignature || null)
        .execute("sp_ManagePayments");

    return result.recordset[0];
};

// DELETE PAYMENT
const deletePayment = async (paymentId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "DELETE")
        .input("PaymentId", sql.BigInt, paymentId)
        .execute("sp_ManagePayments");

    return result.recordset[0];
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentsByOrder,
    getAllPayments,
    updatePaymentStatus,
    updateGatewayDetails,
    deletePayment
};