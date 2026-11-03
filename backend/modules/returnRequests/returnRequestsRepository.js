
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// 1. CREATE REQUEST
const createRequest = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CREATE")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("OrderItemId", sql.BigInt, data.OrderItemId)
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("RequestType", sql.NVarChar(20), data.RequestType)
        .input("Reason", sql.NVarChar(250), data.Reason)
        .input("Description", sql.NVarChar(1000), data.Description)
        .execute("sp_ManageReturnRequests");

    return result.recordset[0];
};

// 2. GET CUSTOMER REQUESTS
const getByCustomer = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_CUSTOMER")
        .input("CustomerId", sql.Int, customerId)
        .execute("sp_ManageReturnRequests");

    return result.recordset;
};

// 3. GET REQUEST BY ID
const getById = async (requestId, customerId = null) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("ReturnRequestId", sql.BigInt, requestId)
        .input("CustomerId", sql.Int, customerId)
        .execute("sp_ManageReturnRequests");

    return result.recordset[0] || null;
};

// 4. GET ALL REQUESTS
const getAll = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("CustomerId", sql.Int, filters.CustomerId)
        .input("RequestStatus", sql.NVarChar(20), filters.RequestStatus)
        .input("RequestType", sql.NVarChar(20), filters.RequestType)
        .input("RefundStatus", sql.NVarChar(20), filters.RefundStatus)
        .execute("sp_ManageReturnRequests");

    return result.recordset;
};

// 5. UPDATE REQUEST STATUS
const updateStatus = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_STATUS")
        .input("ReturnRequestId", sql.BigInt, data.ReturnRequestId)
        .input("RequestStatus", sql.NVarChar(20), data.RequestStatus)
        .input("AdminNotes", sql.NVarChar(1000), data.AdminNotes)
        .execute("sp_ManageReturnRequests");

    return result.recordset[0];
};

// 6. UPDATE REFUND
const updateRefund = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_REFUND")
        .input("ReturnRequestId", sql.BigInt, data.ReturnRequestId)
        .input("RefundStatus", sql.NVarChar(20), data.RefundStatus)
        .input("RefundAmount", sql.Decimal(12, 2), data.RefundAmount)
        .input("RefundMethod", sql.NVarChar(30), data.RefundMethod)
        .input("AdminNotes", sql.NVarChar(1000), data.AdminNotes)
        .execute("sp_ManageReturnRequests");

    return result.recordset[0];
};

// 7. DELETE REQUEST
const deleteRequest = async (requestId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("ReturnRequestId", sql.BigInt, requestId)
        .execute("sp_ManageReturnRequests");

    return result.recordset[0];
};

module.exports = {
    createRequest,
    getByCustomer,
    getById,
    getAll,
    updateStatus,
    updateRefund,
    deleteRequest
};
