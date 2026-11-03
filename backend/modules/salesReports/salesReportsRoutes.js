const express = require("express");
const router = express.Router();

const controller = require("./salesReportsController");

const {
    validateDateQuery,
    validateTopCount,
    validateThreshold
} = require("./salesReportsValidation");

const adminAuth = require("../customer/adminAuthMiddleware.js");

// Dashboard Summary
router.get(
    "/summary",
    adminAuth,
    controller.getSummary
);

// Revenue Trend
router.get(
    "/revenue-trend",
    adminAuth,
    validateDateQuery,
    controller.getRevenueTrend
);

// Best Selling Products
router.get(
    "/best-selling",
    adminAuth,
    validateDateQuery,
    validateTopCount,
    controller.getBestSellingProducts
);

// Low Stock Products
router.get(
    "/low-stock",
    adminAuth,
    controller.getLowStockProducts
);

// Pending Orders
router.get(
    "/pending-orders",
    adminAuth,
    validateDateQuery,
    controller.getPendingOrders
);

// Recent Orders
router.get(
    "/recent-orders",
    adminAuth,
    validateTopCount,
    controller.getRecentOrders
);

// Update Low Stock Settings
router.put(
    "/settings",
    adminAuth,
    validateThreshold,
    controller.updateSettings
);

module.exports = router;