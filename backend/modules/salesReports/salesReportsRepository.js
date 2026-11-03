const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// 1. Dashboard Summary
const getSummary = async (filters = {}) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "SUMMARY")
        .input("FromDate", sql.Date, filters.fromDate || null)
        .input("ToDate", sql.Date, filters.toDate || null)
        .input("LowStockThreshold", sql.Int, null)
        .input("TopCount", sql.Int, 10)
        .execute("sp_SalesReports");

    return result.recordset[0];
};

// 2. Revenue Trend
const getRevenueTrend = async (filters = {}) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "REVENUE_TREND")
        .input("FromDate", sql.Date, filters.fromDate || null)
        .input("ToDate", sql.Date, filters.toDate || null)
        .input("LowStockThreshold", sql.Int, null)
        .input("TopCount", sql.Int, 10)
        .execute("sp_SalesReports");

    return result.recordset;
};

// 3. Best Selling Products
const getBestSellingProducts = async (filters = {}) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "BEST_SELLING")
        .input("FromDate", sql.Date, filters.fromDate || null)
        .input("ToDate", sql.Date, filters.toDate || null)
        .input("LowStockThreshold", sql.Int, null)
        .input("TopCount", sql.Int, filters.topCount || 10)
        .execute("sp_SalesReports");

    return result.recordset;
};

// 4. Low Stock Products
const getLowStockProducts = async (threshold = null) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "LOW_STOCK")
        .input("FromDate", sql.Date, null)
        .input("ToDate", sql.Date, null)
        .input("LowStockThreshold", sql.Int, threshold)
        .input("TopCount", sql.Int, 10)
        .execute("sp_SalesReports");

    return result.recordset;
};

// 5. Pending Orders
const getPendingOrders = async (filters = {}) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "PENDING_ORDERS")
        .input("FromDate", sql.Date, filters.fromDate || null)
        .input("ToDate", sql.Date, filters.toDate || null)
        .input("LowStockThreshold", sql.Int, null)
        .input("TopCount", sql.Int, 10)
        .execute("sp_SalesReports");

    return result.recordset;
};

// 6. Recent Orders
const getRecentOrders = async (topCount = 10) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "RECENT_ORDERS")
        .input("FromDate", sql.Date, null)
        .input("ToDate", sql.Date, null)
        .input("LowStockThreshold", sql.Int, null)
        .input("TopCount", sql.Int, topCount)
        .execute("sp_SalesReports");

    return result.recordset;
};

// 7. Update Report Settings
const updateSettings = async (threshold) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_SETTINGS")
        .input("FromDate", sql.Date, null)
        .input("ToDate", sql.Date, null)
        .input("LowStockThreshold", sql.Int, threshold)
        .input("TopCount", sql.Int, 10)
        .execute("sp_SalesReports");

    return result.recordset[0];
};

module.exports = {
    getSummary,
    getRevenueTrend,
    getBestSellingProducts,
    getLowStockProducts,
    getPendingOrders,
    getRecentOrders,
    updateSettings
};