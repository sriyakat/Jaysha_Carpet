// payment.service.js

const paymentRepository = require("./paymentRepository.js");

// ADMIN CHECK
const checkAdmin = (user) => {
    if (!user) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    const role = user.RoleName || user.Role || user.roleName || user.role;

    if (String(role || "").toUpperCase() !== "ADMIN") {
        const error = new Error("Admin access required.");
        error.statusCode = 403;
        throw error;
    }
};

// VALIDATE ID
const validateId = (id, fieldName) => {
    const value = Number(id);

    if (!Number.isSafeInteger(value) || value <= 0) {
        const error = new Error(`Valid ${fieldName} is required.`);
        error.statusCode = 400;
        throw error;
    }

    return value;
};

// CREATE PAYMENT
const createPayment = async (paymentData, user) => {
    checkAdmin(user);

    const OrderId = validateId(paymentData.OrderId, "OrderId");

    const Amount = Number(paymentData.Amount);

    if (!Number.isFinite(Amount) || Amount < 0) {
        const error = new Error("Valid payment amount is required.");
        error.statusCode = 400;
        throw error;
    }

    const PaymentMethod = String(paymentData.PaymentMethod || "").toUpperCase();

    if (!["COD", "ONLINE"].includes(PaymentMethod)) {
        const error = new Error("PaymentMethod must be COD or ONLINE.");
        error.statusCode = 400;
        throw error;
    }

    return await paymentRepository.createPayment({
        OrderId,
        PaymentMethod,
        Amount
    });
};

// GET PAYMENT BY ID
const getPaymentById = async (paymentId, user) => {
    checkAdmin(user);

    const id = validateId(paymentId, "PaymentId");

    const payment = await paymentRepository.getPaymentById(id);

    if (!payment) {
        const error = new Error("Payment not found.");
        error.statusCode = 404;
        throw error;
    }

    return payment;
};

// GET PAYMENTS BY ORDER
const getPaymentsByOrder = async (orderId, user) => {
    checkAdmin(user);

    const id = validateId(orderId, "OrderId");

    return await paymentRepository.getPaymentsByOrder(id);
};

// GET ALL PAYMENTS
const getAllPayments = async (user) => {
    checkAdmin(user);

    return await paymentRepository.getAllPayments();
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (paymentData, user) => {
    checkAdmin(user);

    const PaymentId = validateId(paymentData.PaymentId, "PaymentId");

    const PaymentStatus = String(paymentData.PaymentStatus || "").toUpperCase();

    const allowedStatuses = [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED"
    ];

    if (!allowedStatuses.includes(PaymentStatus)) {
        const error = new Error("Invalid PaymentStatus.");
        error.statusCode = 400;
        throw error;
    }

    return await paymentRepository.updatePaymentStatus({
        PaymentId,
        PaymentStatus
    });
};

// UPDATE GATEWAY DETAILS
const updateGatewayDetails = async (paymentData, user) => {
    checkAdmin(user);

    const PaymentId = validateId(paymentData.PaymentId, "PaymentId");

    if (
        !paymentData.GatewayName &&
        !paymentData.GatewayOrderId &&
        !paymentData.GatewayPaymentId &&
        !paymentData.GatewaySignature
    ) {
        const error = new Error("At least one gateway detail is required.");
        error.statusCode = 400;
        throw error;
    }

    return await paymentRepository.updateGatewayDetails({
        PaymentId,
        GatewayName: paymentData.GatewayName,
        GatewayOrderId: paymentData.GatewayOrderId,
        GatewayPaymentId: paymentData.GatewayPaymentId,
        GatewaySignature: paymentData.GatewaySignature
    });
};

// DELETE PAYMENT
const deletePayment = async (paymentId, user) => {
    checkAdmin(user);

    const id = validateId(paymentId, "PaymentId");

    return await paymentRepository.deletePayment(id);
};

module.exports = {
    createPayment,
    getPaymentById,
    getPaymentsByOrder,
    getAllPayments,
    updatePaymentStatus,
    updateGatewayDetails,
    deletePayment
};