
const repository = require("../customerOrder/customerOrderRepository.js");

const validateId = (value, fieldName) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        throw new Error(`${fieldName} must be a valid positive integer.`);
    }

    return id;
};

const validateAmount = (value, fieldName) => {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`${fieldName} must be a valid non-negative amount.`);
    }

    return amount;
};


// 1. CREATE ORDER
const createOrder = async (customerId, data) => {
    customerId = validateId(customerId, "CustomerId");

    const addressId = validateId(data.AddressId, "AddressId");
    const cartId = validateId(data.CartId, "CartId");

    const paymentMethod = String(data.PaymentMethod || "").toUpperCase();

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
        throw new Error("PaymentMethod must be COD or ONLINE.");
    }

    if (
        data.CustomerNotes !== undefined &&
        data.CustomerNotes !== null &&
        String(data.CustomerNotes).length > 500
    ) {
        throw new Error("CustomerNotes cannot exceed 500 characters.");
    }

    // Shipping aur tax abhi server-side zero rakhe gaye hain.
    // Client se bheje gaye totals/charges trust nahi karne hain.
    return await repository.createOrder({
        CustomerId: customerId,
        AddressId: addressId,
        CartId: cartId,
        PaymentMethod: paymentMethod,
        ShippingCharges: 0,
        TaxAmount: 0,
        CustomerNotes: data.CustomerNotes || null
    });
};


// 2. GET MY ORDERS
const getMyOrders = async (customerId) => {
    customerId = validateId(customerId, "CustomerId");

    return await repository.getMyOrders(customerId);
};


// 3. GET ORDER BY ID
const getOrderById = async (customerId, orderId) => {
    customerId = validateId(customerId, "CustomerId");
    orderId = validateId(orderId, "OrderId");

    const result = await repository.getOrderById(customerId, orderId);

    if (!result.order) {
        throw new Error("Order not found.");
    }

    return result;
};


// 4. GET ALL ORDERS (ADMIN)
const getAllOrders = async () => {
    return await repository.getAllOrders();
};


// 5. UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (data) => {
    const orderId = validateId(data.OrderId, "OrderId");
    const orderStatus = String(data.OrderStatus || "").toUpperCase();

    const allowedStatuses = [
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED"
    ];

    if (!allowedStatuses.includes(orderStatus)) {
        throw new Error("Invalid OrderStatus.");
    }

    return await repository.updateOrderStatus({
        OrderId: orderId,
        OrderStatus: orderStatus
    });
};


// 6. UPDATE PAYMENT STATUS
const updatePaymentStatus = async (data) => {
    const orderId = validateId(data.OrderId, "OrderId");
    const paymentStatus = String(data.PaymentStatus || "").toUpperCase();

    const allowedStatuses = [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED"
    ];

    if (!allowedStatuses.includes(paymentStatus)) {
        throw new Error("Invalid PaymentStatus.");
    }

    return await repository.updatePaymentStatus({
        OrderId: orderId,
        PaymentStatus: paymentStatus
    });
};


// 7. UPDATE TRACKING NUMBER
const updateTrackingNumber = async (data) => {
    const orderId = validateId(data.OrderId, "OrderId");

    if (
        typeof data.TrackingNumber !== "string" ||
        !data.TrackingNumber.trim()
    ) {
        throw new Error("TrackingNumber is required.");
    }

    if (data.TrackingNumber.trim().length > 100) {
        throw new Error("TrackingNumber cannot exceed 100 characters.");
    }

    return await repository.updateTrackingNumber({
        OrderId: orderId,
        TrackingNumber: data.TrackingNumber.trim()
    });
};


// 8. CANCEL ORDER
const cancelOrder = async (customerId, orderId) => {
    customerId = validateId(customerId, "CustomerId");
    orderId = validateId(orderId, "OrderId");

    return await repository.cancelOrder(customerId, orderId);
};


// 9. GET ORDER ITEMS
const getOrderItems = async (orderId, customerId = null) => {
    orderId = validateId(orderId, "OrderId");

    if (customerId !== null) {
        customerId = validateId(customerId, "CustomerId");
    }

    return await repository.getOrderItems(orderId, customerId);
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
    getOrderItems
};
