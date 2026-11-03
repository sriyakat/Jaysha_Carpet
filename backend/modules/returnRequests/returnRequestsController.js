
const service = require("./returnRequestsService");

// COMMON ERROR HANDLER
const handleError = (res, error) => {
    console.error("Return Request Error:", error);

    const notFoundErrors = [50004, 50014];
    const errorNumber = error.number;

    let statusCode = 500;

    if (error.message.includes("Only admin")) {
        statusCode = 403;
    } else if (
        error.message.includes("not found") ||
        notFoundErrors.includes(errorNumber)
    ) {
        statusCode = 404;
    } else if (
        errorNumber >= 50001 && errorNumber <= 50025
    ) {
        statusCode = 400;
    } else if (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("must be") ||
        error.message.includes("positive")
    ) {
        statusCode = 400;
    }

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Something went wrong."
    });
};

// CUSTOMER CREATE REQUEST
const createRequest = async (req, res) => {
    try {
        const data = await service.createRequest(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Return/cancellation request submitted successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// CUSTOMER GET MY REQUESTS
const getMyRequests = async (req, res) => {
    try {
        const data = await service.getMyRequests(req.user);

        return res.status(200).json({
            success: true,
            message: "Your requests fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// CUSTOMER GET MY REQUEST BY ID
const getMyRequestById = async (req, res) => {
    try {
        const data = await service.getMyRequestById(
            req.params.requestId,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Request fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ADMIN GET ALL
const getAllRequests = async (req, res) => {
    try {
        const filters = {
            CustomerId: req.query.customerId || null,
            RequestStatus: req.query.requestStatus || null,
            RequestType: req.query.requestType || null,
            RefundStatus: req.query.refundStatus || null
        };

        const data = await service.getAllRequests(filters, req.user);

        return res.status(200).json({
            success: true,
            message: "All requests fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ADMIN UPDATE STATUS
const updateStatus = async (req, res) => {
    try {
        const data = await service.updateStatus({
            ReturnRequestId: req.params.requestId,
            RequestStatus: req.body.RequestStatus,
            AdminNotes: req.body.AdminNotes || null
        }, req.user);

        return res.status(200).json({
            success: true,
            message: "Request status updated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ADMIN UPDATE REFUND
const updateRefund = async (req, res) => {
    try {
        const data = await service.updateRefund({
            ReturnRequestId: req.params.requestId,
            RefundStatus: req.body.RefundStatus,
            RefundAmount: req.body.RefundAmount ?? null,
            RefundMethod: req.body.RefundMethod || null,
            AdminNotes: req.body.AdminNotes || null
        }, req.user);

        return res.status(200).json({
            success: true,
            message: "Refund status updated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// ADMIN DELETE
const deleteRequest = async (req, res) => {
    try {
        const data = await service.deleteRequest(
            req.params.requestId,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Request deleted successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    createRequest,
    getMyRequests,
    getMyRequestById,
    getAllRequests,
    updateStatus,
    updateRefund,
    deleteRequest
};
