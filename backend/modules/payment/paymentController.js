// payment.controller.js

const paymentService = require("./paymentService.js");

// CREATE PAYMENT
const createPayment = async (req, res) => {
    try {
        const result = await paymentService.createPayment(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Payment created successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
    try {
        const result = await paymentService.getPaymentById(
            req.params.paymentId,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Payment fetched successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// GET PAYMENTS BY ORDER
const getPaymentsByOrder = async (req, res) => {
    try {
        const result = await paymentService.getPaymentsByOrder(
            req.params.orderId,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Order payments fetched successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// GET ALL PAYMENTS
const getAllPayments = async (req, res) => {
    try {
        const result = await paymentService.getAllPayments(req.user);

        return res.status(200).json({
            success: true,
            message: "All payments fetched successfully.",
            count: result.length,
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE PAYMENT STATUS
const updatePaymentStatus = async (req, res) => {
    try {
        const paymentData = {
            PaymentId: req.params.paymentId,
            PaymentStatus: req.body.PaymentStatus
        };

        const result = await paymentService.updatePaymentStatus(
            paymentData,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE GATEWAY DETAILS
const updateGatewayDetails = async (req, res) => {
    try {
        const paymentData = {
            PaymentId: req.params.paymentId,
            GatewayName: req.body.GatewayName,
            GatewayOrderId: req.body.GatewayOrderId,
            GatewayPaymentId: req.body.GatewayPaymentId,
            GatewaySignature: req.body.GatewaySignature
        };

        const result = await paymentService.updateGatewayDetails(
            paymentData,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Gateway details updated successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE PAYMENT
const deletePayment = async (req, res) => {
    try {
        const result = await paymentService.deletePayment(
            req.params.paymentId,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Payment deleted successfully.",
            data: result
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
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