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

const trackAnalyticsEvent = async (event) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("EventType", sql.NVarChar(30), event.eventType)
        .input("ProductId", sql.Int, event.productId)
        .input("SessionKey", sql.NVarChar(100), event.sessionKey)
        .input("CustomerId", sql.Int, event.customerId)
        .input("OrderId", sql.BigInt, event.orderId)
        .input("EventValue", sql.Decimal(12, 2), event.eventValue)
        .input("Metadata", sql.NVarChar(sql.MAX), event.metadata)
        .query(`
            INSERT INTO dbo.StoreAnalyticsEvents
                (EventType, ProductId, SessionKey, CustomerId, OrderId, EventValue, Metadata)
            OUTPUT INSERTED.EventId, INSERTED.EventType, INSERTED.CreatedAt
            VALUES
                (@EventType, @ProductId, @SessionKey, @CustomerId, @OrderId, @EventValue, @Metadata)
        `);
    return result.recordset[0];
};

const getAnalyticsSummary = async (filters = {}) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("FromDate", sql.DateTime2, filters.fromDate ? new Date(filters.fromDate) : null)
        .input("ToDate", sql.DateTime2, filters.toDate ? new Date(`${filters.toDate}T23:59:59.999`) : null)
        .query(`
            SELECT EventType, COUNT(*) AS EventCount
            FROM dbo.StoreAnalyticsEvents
            WHERE (@FromDate IS NULL OR CreatedAt >= @FromDate)
              AND (@ToDate IS NULL OR CreatedAt <= @ToDate)
            GROUP BY EventType
        `);

    const counts = Object.fromEntries(result.recordset.map((row) => [row.EventType, Number(row.EventCount)]));
    const checkoutStarted = counts.CHECKOUT_STARTED || 0;
    const orderCompleted = counts.ORDER_COMPLETED || 0;
    return {
        ...counts,
        conversionRate: checkoutStarted > 0
            ? Number(((orderCompleted / checkoutStarted) * 100).toFixed(2))
            : 0
    };
};

module.exports = {
    getSummary,
    getRevenueTrend,
    getBestSellingProducts,
    getLowStockProducts,
    getPendingOrders,
    getRecentOrders,
    updateSettings
    ,
    trackAnalyticsEvent,
    getAnalyticsSummary
};