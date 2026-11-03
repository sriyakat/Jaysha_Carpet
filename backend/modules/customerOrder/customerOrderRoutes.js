
const express = require("express");
const router = express.Router();

const controller = require("../customerOrder/customerOrderController.js");

const customerAuth = require("../customer/customerAuthMiddleware");
const adminAuth = require("../customer/adminAuthMiddleware");


// =====================================
// CUSTOMER ROUTES
// =====================================

// Create order from cart
router.post("/", customerAuth, controller.createOrder);

// Get logged-in customer's orders
router.get("/", customerAuth, controller.getMyOrders);

// Get customer's order items
router.get("/:orderId/items", customerAuth, controller.getOrderItems);

// Get customer's order details
router.get("/:orderId", customerAuth, controller.getOrderById);

// Cancel customer's order
router.patch("/:orderId/cancel", customerAuth, controller.cancelOrder);


// =====================================
// ADMIN ROUTES
// =====================================

// Get all orders
router.get("/admin/all", adminAuth, controller.getAllOrders);

// Get any order's items
router.get("/admin/:orderId/items", adminAuth, controller.getAdminOrderItems);

// Update order status
router.patch("/admin/:orderId/status", adminAuth, controller.updateOrderStatus);

// Update payment status
router.patch("/admin/:orderId/payment", adminAuth, controller.updatePaymentStatus);

// Update tracking number
router.patch("/admin/:orderId/tracking", adminAuth, controller.updateTrackingNumber);


module.exports = router;
