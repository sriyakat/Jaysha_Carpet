
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// 1. STOCK IN
const stockIn = async (inventoryData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "STOCK_IN")
        .input("ProductId", sql.Int, inventoryData.ProductId)
        .input("Quantity", sql.Int, inventoryData.Quantity)
        .input("Remarks", sql.NVarChar(500), inventoryData.Remarks || null)
        .input("CreatedBy", sql.Int, inventoryData.CreatedBy)
        .execute("sp_ManageInventoryTransactions");

    return result.recordset[0];
};

// 2. STOCK OUT
const stockOut = async (inventoryData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "STOCK_OUT")
        .input("ProductId", sql.Int, inventoryData.ProductId)
        .input("OrderId", sql.BigInt, inventoryData.OrderId || null)
        .input("Quantity", sql.Int, inventoryData.Quantity)
        .input("Remarks", sql.NVarChar(500), inventoryData.Remarks || null)
        .input("CreatedBy", sql.Int, inventoryData.CreatedBy)
        .execute("sp_ManageInventoryTransactions");

    return result.recordset[0];
};

// 3. STOCK ADJUSTMENT
const stockAdjustment = async (inventoryData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "ADJUSTMENT")
        .input("ProductId", sql.Int, inventoryData.ProductId)
        .input("Quantity", sql.Int, inventoryData.Quantity)
        .input("Remarks", sql.NVarChar(500), inventoryData.Remarks || null)
        .input("CreatedBy", sql.Int, inventoryData.CreatedBy)
        .execute("sp_ManageInventoryTransactions");

    return result.recordset[0];
};

// 4. GET TRANSACTIONS BY PRODUCT
const getTransactionsByProduct = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("sp_ManageInventoryTransactions");

    return result.recordset;
};

// 5. GET ALL TRANSACTIONS
const getAllTransactions = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_ALL")
        .execute("sp_ManageInventoryTransactions");

    return result.recordset;
};

// 6. GET TRANSACTION BY ID
const getTransactionById = async (transactionId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(50), "GET_BY_ID")
        .input("InventoryTransactionId", sql.BigInt, transactionId)
        .execute("sp_ManageInventoryTransactions");

    return result.recordset[0] || null;
};

module.exports = {
    stockIn,
    stockOut,
    stockAdjustment,
    getTransactionsByProduct,
    getAllTransactions,
    getTransactionById
};
