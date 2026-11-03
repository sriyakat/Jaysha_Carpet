// payment.validation.js

const validatePaymentId = (req, res, next) => {
    const paymentId = Number(req.params.paymentId);

    if (!Number.isSafeInteger(paymentId) || paymentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid PaymentId."
        });
    }

    next();
};

const validateOrderId = (req, res, next) => {
    const orderId = Number(req.params.orderId);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid OrderId."
        });
    }

    next();
};

const validateCreatePayment = (req, res, next) => {
    const { OrderId, PaymentMethod, Amount } = req.body;

    if (!OrderId || !Number.isSafeInteger(Number(OrderId)) || Number(OrderId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid OrderId is required."
        });
    }

    if (!PaymentMethod || !["COD", "ONLINE"].includes(String(PaymentMethod).toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: "PaymentMethod must be COD or ONLINE."
        });
    }

    if (Amount === undefined || Amount === null || Amount === "" ||
        !Number.isFinite(Number(Amount)) || Number(Amount) < 0) {
        return res.status(400).json({
            success: false,
            message: "Valid Amount is required."
        });
    }

    next();
};

const validatePaymentStatus = (req, res, next) => {
    const allowedStatuses = [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED"
    ];

    const status = String(req.body.PaymentStatus || "").toUpperCase();

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid PaymentStatus."
        });
    }

    next();
};

const validateGatewayDetails = (req, res, next) => {
    const {
        GatewayName,
        GatewayOrderId,
        GatewayPaymentId,
        GatewaySignature
    } = req.body;

    if (!GatewayName && !GatewayOrderId && !GatewayPaymentId && !GatewaySignature) {
        return res.status(400).json({
            success: false,
            message: "At least one gateway detail is required."
        });
    }

    next();
};

module.exports = {
    validatePaymentId,
    validateOrderId,
    validateCreatePayment,
    validatePaymentStatus,
    validateGatewayDetails
};