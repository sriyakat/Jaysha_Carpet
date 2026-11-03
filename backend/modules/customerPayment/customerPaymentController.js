const service = require("./customerPaymentService.js");

const getCustomerId = (req) => req.user?.CustomerId;

const handleError = (res, error) => {
    console.error("Customer payment API error:", error);

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Unable to process the payment request."
    });
};

const getConfig = (req, res) => {
    try {
        return res.status(200).json({ success: true, data: service.getConfig() });
    } catch (error) {
        return handleError(res, error);
    }
};

const createRazorpayOrder = async (req, res) => {
    try {
        const data = await service.createRazorpayOrder(getCustomerId(req), req.params.orderId);
        return res.status(201).json({
            success: true,
            message: "Razorpay order created successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const verifyRazorpayPayment = async (req, res) => {
    try {
        const data = await service.verifyRazorpayPayment(
            getCustomerId(req),
            req.params.orderId,
            req.body,
        );
        return res.status(200).json({
            success: true,
            message: "Payment verified successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    getConfig,
    createRazorpayOrder,
    verifyRazorpayPayment
};
