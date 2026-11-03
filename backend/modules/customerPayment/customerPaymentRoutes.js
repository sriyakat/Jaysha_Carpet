const express = require("express");
const customerAuth = require("../customer/customerAuthMiddleware.js");
const controller = require("./customerPaymentController.js");

const router = express.Router();

router.get("/razorpay/config", customerAuth, controller.getConfig);
router.post("/razorpay/orders/:orderId", customerAuth, controller.createRazorpayOrder);
router.post("/razorpay/orders/:orderId/verify", customerAuth, controller.verifyRazorpayPayment);

module.exports = router;
