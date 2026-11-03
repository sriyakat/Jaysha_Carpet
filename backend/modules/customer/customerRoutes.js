
const express = require("express");

const router = express.Router();

const customerController = require("../customer/customerController");

const customerAuth = require("../customer/customerAuthMiddleware");
const adminAuth = require("../customer/adminAuthMiddleware");


// ======================================
// PUBLIC ROUTES
// ======================================

// Customer registration requires a verified mobile OTP.
router.post(
    "/register",
    customerController.sendRegistrationOtp
);

router.post(
    "/register/verify-otp",
    customerController.verifyRegistrationOtp
);


// Customer Login
router.post(
    "/login",
    customerController.loginCustomer
);

router.post(
    "/forgot-password",
    customerController.sendPasswordResetOtp
);

router.post(
    "/forgot-password/reset",
    customerController.resetPasswordWithOtp
);


// ======================================
// CUSTOMER PROTECTED ROUTES
// ======================================

// Get Customer Profile
router.get(
    "/profile",
    customerAuth,
    customerController.getCustomerProfile
);


// Update Customer Profile
router.put(
    "/profile",
    customerAuth,
    customerController.updateCustomerProfile
);


// Change Customer Password
router.put(
    "/change-password",
    customerAuth,
    customerController.changeCustomerPassword
);


// ======================================
// ADMIN ROUTES
// ======================================

// Get All Customers
router.get(
    "/admin/all",
    adminAuth,
    customerController.getAllCustomers
);


// Get Customer By ID
router.get(
    "/admin/:customerId",
    adminAuth,
    customerController.getCustomerById
);


module.exports = router;
