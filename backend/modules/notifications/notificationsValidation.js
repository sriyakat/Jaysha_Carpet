const sendError = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};


const isValidId = (value) => {
    return (
        value !== undefined &&
        value !== null &&
        /^\d+$/.test(String(value)) &&
        Number(value) > 0 &&
        Number.isSafeInteger(Number(value))
    );
};


// Validate NotificationId
const validateNotificationId = (req, res, next) => {

    if (!isValidId(req.params.notificationId)) {
        return sendError(res, "Valid NotificationId is required.");
    }

    next();
};


// Validate CREATE
const validateCreateNotification = (req, res, next) => {

    const {
        CustomerId,
        OrderId,
        NotificationType,
        Title,
        Message,
        RecipientEmail
    } = req.body;

    if (
        typeof NotificationType !== "string" ||
        !NotificationType.trim() ||
        NotificationType.trim().length > 50
    ) {
        return sendError(res, "Valid NotificationType is required.");
    }

    if (
        typeof Title !== "string" ||
        !Title.trim() ||
        Title.trim().length > 150
    ) {
        return sendError(res, "Valid Title is required.");
    }

    if (
        typeof Message !== "string" ||
        !Message.trim() ||
        Message.length > 1000
    ) {
        return sendError(res, "Valid Message is required (maximum 1000 characters).");
    }

    if (CustomerId !== undefined && CustomerId !== null &&
        CustomerId !== "" && !isValidId(CustomerId)) {
        return sendError(res, "Invalid CustomerId.");
    }

    if (OrderId !== undefined && OrderId !== null &&
        OrderId !== "" && !isValidId(OrderId)) {
        return sendError(res, "Invalid OrderId.");
    }

    if (
        RecipientEmail !== undefined &&
        RecipientEmail !== null &&
        RecipientEmail !== "" &&
        (
            typeof RecipientEmail !== "string" ||
            RecipientEmail.length > 150 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(RecipientEmail)
        )
    ) {
        return sendError(res, "Valid RecipientEmail is required.");
    }

    next();
};


// Validate Admin Filters
const validateNotificationFilters = (req, res, next) => {

    const { customerId, orderId, isRead, isSent } = req.query;

    if (customerId !== undefined && !isValidId(customerId)) {
        return sendError(res, "Invalid customerId filter.");
    }

    if (orderId !== undefined && !isValidId(orderId)) {
        return sendError(res, "Invalid orderId filter.");
    }

    if (isRead !== undefined && !["0", "1"].includes(String(isRead))) {
        return sendError(res, "isRead must be 0 or 1.");
    }

    if (isSent !== undefined && !["0", "1"].includes(String(isSent))) {
        return sendError(res, "isSent must be 0 or 1.");
    }

    next();
};


module.exports = {
    validateNotificationId,
    validateCreateNotification,
    validateNotificationFilters
};