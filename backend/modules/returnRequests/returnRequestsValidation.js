
const validateCreateRequest = (req, res, next) => {
    const { OrderId, OrderItemId, RequestType, Reason, Description } = req.body;

    if (!Number.isInteger(Number(OrderId)) || Number(OrderId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid OrderId is required."
        });
    }

    if (
        OrderItemId !== undefined &&
        OrderItemId !== null &&
        (!Number.isInteger(Number(OrderItemId)) || Number(OrderItemId) <= 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid OrderItemId."
        });
    }

    if (!["CANCELLATION", "RETURN"].includes(
        String(RequestType || "").toUpperCase()
    )) {
        return res.status(400).json({
            success: false,
            message: "RequestType must be CANCELLATION or RETURN."
        });
    }

    if (typeof Reason !== "string" || !Reason.trim() || Reason.length > 250) {
        return res.status(400).json({
            success: false,
            message: "Reason is required and maximum 250 characters."
        });
    }

    if (
        Description !== undefined &&
        Description !== null &&
        (typeof Description !== "string" || Description.length > 1000)
    ) {
        return res.status(400).json({
            success: false,
            message: "Description cannot exceed 1000 characters."
        });
    }

    next();
};

const validateRequestId = (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.requestId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid ReturnRequestId."
        });
    }

    next();
};

const validateUpdateStatus = (req, res, next) => {
    if (!["APPROVED", "REJECTED"].includes(req.body.RequestStatus)) {
        return res.status(400).json({
            success: false,
            message: "RequestStatus must be APPROVED or REJECTED."
        });
    }

    next();
};

const validateUpdateRefund = (req, res, next) => {
    const { RefundStatus, RefundAmount, RefundMethod, AdminNotes } = req.body;

    if (!["PENDING", "PROCESSING", "COMPLETED", "FAILED"]
        .includes(RefundStatus)) {
        return res.status(400).json({
            success: false,
            message: "Invalid RefundStatus."
        });
    }

    if (
        RefundAmount !== undefined &&
        RefundAmount !== null &&
        (!Number.isFinite(Number(RefundAmount)) || Number(RefundAmount) < 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid RefundAmount."
        });
    }

    if (
        RefundMethod !== undefined &&
        RefundMethod !== null &&
        (typeof RefundMethod !== "string" || RefundMethod.length > 30)
    ) {
        return res.status(400).json({
            success: false,
            message: "RefundMethod cannot exceed 30 characters."
        });
    }

    if (
        AdminNotes !== undefined &&
        AdminNotes !== null &&
        (typeof AdminNotes !== "string" || AdminNotes.length > 1000)
    ) {
        return res.status(400).json({
            success: false,
            message: "AdminNotes cannot exceed 1000 characters."
        });
    }

    next();
};

module.exports = {
    validateCreateRequest,
    validateRequestId,
    validateUpdateStatus,
    validateUpdateRefund
};
