const notificationService = require("./notificationsService.js");


// COMMON ERROR HANDLER
const handleError = (res, error) => {

    console.error("Notification Module Error:", error);

    const notFoundErrors = [
        50004, 50005, 50009, 50011, 50014, 50016
    ];

    const badRequestErrors = [
        50001, 50002, 50003, 50006, 50007,
        50008, 50010, 50012, 50013, 50015, 50017
    ];

    if (notFoundErrors.includes(error.number)) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    if (badRequestErrors.includes(error.number)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Admin access required.") {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message === "Authentication required." ||
        error.message === "UserId not found in authentication token."
    ) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Customer profile not found.") {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};


// 1. CREATE NOTIFICATION - ADMIN
const createNotification = async (req, res) => {

    try {
        const result = await notificationService.createNotification(
            req.user,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Notification created successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 2. GET MY NOTIFICATIONS - CUSTOMER
const getMyNotifications = async (req, res) => {

    try {
        const result = await notificationService.getMyNotifications(
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Notifications fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 3. GET NOTIFICATION BY ID - ADMIN
const getNotificationById = async (req, res) => {

    try {
        const result = await notificationService.getNotificationById(
            req.user,
            Number(req.params.notificationId)
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 4. GET ALL NOTIFICATIONS - ADMIN
const getAllNotifications = async (req, res) => {

    try {
        const filters = {
            CustomerId: req.query.customerId
                ? Number(req.query.customerId)
                : null,

            OrderId: req.query.orderId
                ? Number(req.query.orderId)
                : null,

            IsRead: req.query.isRead !== undefined
                ? Number(req.query.isRead)
                : null,

            IsSent: req.query.isSent !== undefined
                ? Number(req.query.isSent)
                : null
        };

        const result = await notificationService.getAllNotifications(
            req.user,
            filters
        );

        return res.status(200).json({
            success: true,
            message: "All notifications fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 5. MARK ONE AS READ - CUSTOMER
const markNotificationRead = async (req, res) => {

    try {
        const result = await notificationService.markNotificationRead(
            req.user,
            Number(req.params.notificationId)
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as read.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 6. MARK ALL AS READ - CUSTOMER
const markAllNotificationsRead = async (req, res) => {

    try {
        const result = await notificationService.markAllNotificationsRead(
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Notifications marked as read.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 7. MARK EMAIL AS SENT - ADMIN
const markNotificationSent = async (req, res) => {

    try {
        const result = await notificationService.markNotificationSent(
            req.user,
            Number(req.params.notificationId)
        );

        return res.status(200).json({
            success: true,
            message: "Notification marked as sent.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 8. DELETE NOTIFICATION - ADMIN
const deleteNotification = async (req, res) => {

    try {
        const result = await notificationService.deleteNotification(
            req.user,
            Number(req.params.notificationId)
        );

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
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