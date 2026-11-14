
const service = require("../customerOrder/customerOrderService.js");

// Customer ID JWT middleware se aayegi
const getCustomerId = (req) => {
    return req.user?.CustomerId;
};

// Common error handler
const handleError = (res, error) => {
    console.error("Order API Error:", error);

    const message = error.message || "Internal server error.";

    const isNotFound =
        /not found/i.test(message) ||
        [50012, 50015, 50018, 50020, 50022, 50025, 50026].includes(
            error.number
        );

    const isValidationError =
        /required|invalid|must be|cannot exceed|cannot be cancelled|cannot be negative|empty|insufficient stock|unavailable|price is not set|choose a size|pricing is incomplete/i.test(
            message
        ) ||
        (error.number >= 50001 && error.number <= 50033);

    const statusCode = error.statusCode || (isNotFound ? 404 : isValidationError ? 400 : 500);

    return res.status(statusCode).json({
        success: false,
        message
    });
};


// 1. CREATE ORDER
const createOrder = async (req, res) => {
    try {
        const customerId = getCustomerId(req);

        const result = await service.createOrder(customerId, req.body);

        return res.status(201).json({
            success: true,
            message: "Order placed successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 2. GET MY ORDERS
const getMyOrders = async (req, res) => {
    try {
        const customerId = getCustomerId(req);

        const result = await service.getMyOrders(customerId);

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 3. GET ORDER BY ID
const getOrderById = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { orderId } = req.params;

        const result = await service.getOrderById(customerId, orderId);

        return res.status(200).json({
            success: true,
            message: "Order details fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 4. GET ALL ORDERS (ADMIN)
const getAllOrders = async (req, res) => {
    try {
        const result = await service.getAllOrders();

        return res.status(200).json({
            success: true,
            message: "All orders fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 5. UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (req, res) => {
    try {
        const result = await service.updateOrderStatus({
            OrderId: req.params.orderId,
            OrderStatus: req.body.OrderStatus
        });

        return res.status(200).json({
            success: true,
            message: "Order status updated successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 6. UPDATE PAYMENT STATUS (ADMIN)
const updatePaymentStatus = async (req, res) => {
    try {
        const result = await service.updatePaymentStatus({
            OrderId: req.params.orderId,
            PaymentStatus: req.body.PaymentStatus
        });

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 7. UPDATE TRACKING NUMBER (ADMIN)
const updateTrackingNumber = async (req, res) => {
    try {
        const result = await service.updateTrackingNumber({
            OrderId: req.params.orderId,
            TrackingNumber: req.body.TrackingNumber
        });

        return res.status(200).json({
            success: true,
            message: "Tracking number updated successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 8. CANCEL ORDER (CUSTOMER)
const cancelOrder = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { orderId } = req.params;

        const result = await service.cancelOrder(customerId, orderId);

        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 9. GET ORDER ITEMS (CUSTOMER)
const getOrderItems = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { orderId } = req.params;

        const result = await service.getOrderItems(orderId, customerId);

        return res.status(200).json({
            success: true,
            message: "Order items fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// 10. GET ORDER ITEMS (ADMIN)
const getAdminOrderItems = async (req, res) => {
    try {
        const { orderId } = req.params;

        const result = await service.getOrderItems(orderId);

        return res.status(200).json({
            success: true,
            message: "Order items fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateTrackingNumber,
    cancelOrder,
    getOrderItems,
    getAdminOrderItems
};
