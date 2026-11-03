const express = require("express");
const router = express.Router();

const notificationController = require("./notificationsController.js");

const {
    validateNotificationId,
    validateCreateNotification,
    validateNotificationFilters
} = require("./notificationsValidation.js");

const customerAuth = require("../customer/customerAuthMiddleware.js");
const adminAuth = require("../customer/adminAuthMiddleware.js");


// ======================================
// CUSTOMER ROUTES
// ======================================

// Get logged-in customer's notifications
router.get(
    "/my",
    customerAuth,
    notificationController.getMyNotifications
);

// Mark all customer notifications as read
router.patch(
    "/my/read-all",
    customerAuth,
    notificationController.markAllNotificationsRead
);

// Mark one notification as read
router.patch(
    "/:notificationId/read",
    customerAuth,
    validateNotificationId,
    notificationController.markNotificationRead
);


// ======================================
// ADMIN ROUTES
// ======================================

// Create notification
router.post(
    "/",
    adminAuth,
    validateCreateNotification,
    notificationController.createNotification
);

// Get all notifications with filters
router.get(
    "/admin/all",
    adminAuth,
    validateNotificationFilters,
    notificationController.getAllNotifications
);

// Get notification by ID
router.get(
    "/admin/:notificationId",
    adminAuth,
    validateNotificationId,
    notificationController.getNotificationById
);

// Mark notification email as sent
router.patch(
    "/admin/:notificationId/sent",
    adminAuth,
    validateNotificationId,
    notificationController.markNotificationSent
);

// Delete notification
router.delete(
    "/admin/:notificationId",
    adminAuth,
    validateNotificationId,
    notificationController.deleteNotification
);


module.exports = router;