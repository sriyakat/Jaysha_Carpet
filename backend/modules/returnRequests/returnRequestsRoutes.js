
const express = require("express");
const router = express.Router();

const controller = require("./returnRequestsController");

const {
    validateCreateRequest,
    validateRequestId,
    validateUpdateStatus,
    validateUpdateRefund
} = require("./returnRequestsValidation");

const customerAuth = require("../customer/customerAuthMiddleware.js");
const adminAuth = require("../customer/adminAuthMiddleware.js");

// CUSTOMER ROUTES

// Create cancellation / return request
router.post(
    "/",
    customerAuth,
    validateCreateRequest,
    controller.createRequest
);

// Get my requests
router.get(
    "/my",
    customerAuth,
    controller.getMyRequests
);

// Get my request by ID
router.get(
    "/my/:requestId",
    customerAuth,
    validateRequestId,
    controller.getMyRequestById
);

// ADMIN ROUTES

// Get all requests
router.get(
    "/admin/all",
    adminAuth,
    controller.getAllRequests
);

// Approve / Reject request
router.patch(
    "/admin/:requestId/status",
    adminAuth,
    validateRequestId,
    validateUpdateStatus,
    controller.updateStatus
);

// Update refund status
router.patch(
    "/admin/:requestId/refund",
    adminAuth,
    validateRequestId,
    validateUpdateRefund,
    controller.updateRefund
);

// Delete request
router.delete(
    "/admin/:requestId",
    adminAuth,
    validateRequestId,
    controller.deleteRequest
);

module.exports = router;
