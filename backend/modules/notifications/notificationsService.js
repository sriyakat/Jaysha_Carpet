const notificationRepository = require("./notificationsRepository.js");


// ADMIN CHECK
const checkAdmin = (user) => {

    if (!user) {
        throw new Error("Authentication required.");
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


// CUSTOMER ID FROM LOGIN TOKEN
const getLoggedInCustomerId = async (user) => {

    if (!user) {
        throw new Error("Authentication required.");
    }

    const customerId = user.CustomerId || user.customerId;

    if (customerId) {
        return Number(customerId);
    }

    const userId = user.UserId || user.userId || user.id;

    if (!userId) {
        throw new Error("UserId not found in authentication token.");
    }

    // Customers table se CustomerId find karna
    const sql = require("mssql");
    const { poolPromise } = require("../../config/db");

    const pool = await poolPromise;

    const result = await pool.request()
        .input("UserId", sql.Int, Number(userId))
        .query(`
            SELECT TOP 1 CustomerId
            FROM dbo.Customers
            WHERE UserId = @UserId
        `);

    if (!result.recordset.length) {
        throw new Error("Customer profile not found.");
    }

    return result.recordset[0].CustomerId;
};


// 1. CREATE NOTIFICATION - ADMIN
const createNotification = async (user, data) => {

    checkAdmin(user);

    return await notificationRepository.createNotification(data);
};


// 2. GET CUSTOMER NOTIFICATIONS
const getMyNotifications = async (user) => {

    const customerId = await getLoggedInCustomerId(user);

    return await notificationRepository.getNotificationsByCustomer(
        customerId
    );
};


// 3. GET NOTIFICATION BY ID - ADMIN
const getNotificationById = async (user, notificationId) => {

    checkAdmin(user);

    return await notificationRepository.getNotificationById(
        notificationId
    );
};


// 4. GET ALL NOTIFICATIONS - ADMIN
const getAllNotifications = async (user, filters) => {

    checkAdmin(user);

    return await notificationRepository.getAllNotifications(filters);
};


// 5. MARK ONE AS READ - CUSTOMER
const markNotificationRead = async (user, notificationId) => {

    const customerId = await getLoggedInCustomerId(user);

    return await notificationRepository.markNotificationRead(
        notificationId,
        customerId
    );
};


// 6. MARK ALL AS READ - CUSTOMER
const markAllNotificationsRead = async (user) => {

    const customerId = await getLoggedInCustomerId(user);

    return await notificationRepository.markAllNotificationsRead(
        customerId
    );
};


// 7. MARK EMAIL AS SENT - ADMIN
const markNotificationSent = async (user, notificationId) => {

    checkAdmin(user);

    return await notificationRepository.markNotificationSent(
        notificationId
    );
};


// 8. DELETE NOTIFICATION - ADMIN
const deleteNotification = async (user, notificationId) => {

    checkAdmin(user);

    return await notificationRepository.deleteNotification(
        notificationId
    );
};


module.exports = {
    createNotification,
    getMyNotifications,
    getNotificationById,
    getAllNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    markNotificationSent,
    deleteNotification
};