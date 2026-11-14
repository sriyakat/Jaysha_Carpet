// payment.repository.js

const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// CREATE PAYMENT
const createPayment = async (paymentData) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await transaction.request()
            .input("Action", sql.NVarChar(50), "CREATE")
            .input("OrderId", sql.BigInt, paymentData.OrderId)
            .input("PaymentMethod", sql.NVarChar(30), paymentData.PaymentMethod)
            .input("Amount", sql.Decimal(12, 2), paymentData.Amount)
            .execute("sp_ManagePayments");

        const paymentId = result.recordset?.[0]?.PaymentId;
        if (!paymentId) {
            throw new Error("Payment creation did not return a payment ID.");
        }

        const currencyCode = paymentData.CurrencyCode || "INR";
        const persistedPayment = await transaction.request()
            .input("PaymentId", sql.BigInt, paymentId)
            .input("CurrencyCode", sql.Char(3), currencyCode)
            .input("InrPerUsd", sql.Decimal(12, 6), paymentData.InrPerUsd || null)
            .query(`
                UPDATE dbo.Payments
                SET CurrencyCode = @CurrencyCode, InrPerUsd = @InrPerUsd
                WHERE PaymentId = @PaymentId;
                SELECT * FROM dbo.Payments WHERE PaymentId = @PaymentId;
            `);
        const payment = persistedPayment.recordset?.[0];
        if (!payment) {
            throw new Error("Payment currency details could not be saved.");
        }

        await transaction.commit();
        return payment;
    } catch (error) {
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        throw error;
    }
};

const setCurrency = async ({ PaymentId, CurrencyCode, InrPerUsd }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("PaymentId", sql.BigInt, PaymentId)
        .input("CurrencyCode", sql.Char(3), CurrencyCode)
        .input("InrPerUsd", sql.Decimal(12, 6), InrPerUsd)
        .query(`
            UPDATE dbo.Payments
            SET CurrencyCode = @CurrencyCode, InrPerUsd = @InrPerUsd
            WHERE PaymentId = @PaymentId
        `);
    if (result.rowsAffected?.[0] !== 1) {
        throw new Error("Payment currency details could not be saved.");
    }
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
    setCurrency,
    deletePayment
};