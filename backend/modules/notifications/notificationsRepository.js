const sql = require("mssql");
const { poolPromise } = require("../../config/db");


// 1. CREATE NOTIFICATION
const createNotification = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CREATE")
        .input("CustomerId", sql.Int, data.CustomerId ?? null)
        .input("OrderId", sql.BigInt, data.OrderId ?? null)
        .input("NotificationType", sql.NVarChar(50), data.NotificationType)
        .input("Title", sql.NVarChar(150), data.Title)
        .input("Message", sql.NVarChar(1000), data.Message)
        .input("RecipientEmail", sql.NVarChar(150), data.RecipientEmail ?? null)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


// 2. GET CUSTOMER NOTIFICATIONS
const getNotificationsByCustomer = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_CUSTOMER")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset;
};


// 3. GET NOTIFICATION BY ID
const getNotificationById = async (notificationId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("NotificationId", sql.BigInt, notificationId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


// 4. ADMIN - GET ALL NOTIFICATIONS
const getAllNotifications = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("CustomerId", sql.Int, filters.CustomerId ?? null)
        .input("OrderId", sql.BigInt, filters.OrderId ?? null)
        .input("IsRead", sql.Bit, filters.IsRead ?? null)
        .input("IsSent", sql.Bit, filters.IsSent ?? null)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset;
};


// 5. MARK ONE NOTIFICATION AS READ
const markNotificationRead = async (notificationId, customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "MARK_READ")
        .input("NotificationId", sql.BigInt, notificationId)
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


// 6. MARK ALL CUSTOMER NOTIFICATIONS AS READ
const markAllNotificationsRead = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "MARK_ALL_READ")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


// 7. MARK EMAIL AS SENT
const markNotificationSent = async (notificationId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "MARK_SENT")
        .input("NotificationId", sql.BigInt, notificationId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


// 8. ADMIN - DELETE NOTIFICATION
const deleteNotification = async (notificationId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("NotificationId", sql.BigInt, notificationId)
        .execute("dbo.sp_ManageNotifications");

    return result.recordset[0];
};


module.exports = {
    createNotification,
    getNotificationsByCustomer,
    getNotificationById,
    getAllNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    markNotificationSent,
    deleteNotification
};