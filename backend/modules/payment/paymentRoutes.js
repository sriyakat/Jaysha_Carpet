// payment.routes.js

const express = require("express");
const router = express.Router();

const paymentController = require("./paymentController.js");

const adminAuth = require("../customer/adminAuthMiddleware.js");

const {
    validatePaymentId,
    validateOrderId,
    validateCreatePayment,
    validatePaymentStatus,
    validateGatewayDetails
} = require("./paymentValidation.js");

// CREATE PAYMENT
router.post(
    "/",
    adminAuth,
    validateCreatePayment,
    paymentController.createPayment
);

// GET ALL PAYMENTS
router.get(
    "/",
    adminAuth,
    paymentController.getAllPayments
);

// GET PAYMENT BY ID
router.get(
    "/:paymentId",
    adminAuth,
    validatePaymentId,
    paymentController.getPaymentById
);

// GET PAYMENTS BY ORDER ID
router.get(
    "/order/:orderId",
    adminAuth,
    validateOrderId,
    paymentController.getPaymentsByOrder
);

// UPDATE PAYMENT STATUS
router.patch(
    "/:paymentId/status",
    adminAuth,
    validatePaymentId,
    validatePaymentStatus,
    paymentController.updatePaymentStatus
);

// UPDATE GATEWAY DETAILS
router.patch(
    "/:paymentId/gateway",
    adminAuth,
    validatePaymentId,
    validateGatewayDetails,
    paymentController.updateGatewayDetails
);

// DELETE PAYMENT
router.delete(
    "/:paymentId",
    adminAuth,
    validatePaymentId,
    paymentController.deletePayment
);

module.exports = router;