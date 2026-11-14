
const repository = require("../customerOrder/customerOrderRepository.js");
const addressRepository = require("../customerAddress/customerAddressRepository.js");
const websiteSettingsRepository = require("../websiteSettings/websiteSettingsRepository.js");
const { getCountryCode } = require("../internationalCommerce/market.js");

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

    const address = await addressRepository.getAddressById(customerId, addressId);
    if (!address) {
        const error = new Error("Delivery address not found.");
        error.statusCode = 404;
        throw error;
    }

    const countryCode = getCountryCode(address.Country ?? address.country);
    if (!countryCode) {
        const error = new Error("Delivery is not configured for this country.");
        error.statusCode = 400;
        throw error;
    }

    let currencyCode = "INR";
    let inrPerUsd = null;
    let shippingCharges = 0;
    let shippingChargesUsd = null;
    if (countryCode !== "IN") {
        if (paymentMethod !== "ONLINE") {
            const error = new Error("International orders require online card payment.");
            error.statusCode = 400;
            throw error;
        }

        const settings = await websiteSettingsRepository.getWebsiteSettings();
        inrPerUsd = Number(settings?.InrPerUsd);
        if (!Number.isFinite(inrPerUsd) || inrPerUsd <= 0) {
            const error = new Error("International checkout is not ready. Store currency settings are incomplete.");
            error.statusCode = 503;
            throw error;
        }

        let rates = {};
        if (settings?.InternationalShippingRates) {
            rates = typeof settings.InternationalShippingRates === "string"
                ? JSON.parse(settings.InternationalShippingRates)
                : settings.InternationalShippingRates;
        }
        const shippingRate = rates[countryCode];
        if (!shippingRate || !Number.isFinite(Number(shippingRate.shippingUsd))) {
            const error = new Error("Shipping is not yet configured for your delivery country.");
            error.statusCode = 400;
            throw error;
        }

        const requiredPolicies = [
            settings.ShippingPolicy,
            settings.ReturnPolicy,
            settings.PrivacyPolicy,
            settings.TermsAndConditions
        ];
        if (requiredPolicies.some((policy) => !String(policy || "").trim())) {
            const error = new Error("International checkout is unavailable until store policies are published.");
            error.statusCode = 503;
            throw error;
        }

        currencyCode = "USD";
        shippingChargesUsd = Number(shippingRate.shippingUsd);
        shippingCharges = Math.round(Number(shippingRate.shippingUsd) * inrPerUsd * 100) / 100;
    }

    return await repository.createOrder({
        CustomerId: customerId,
        AddressId: addressId,
        CartId: cartId,
        PaymentMethod: paymentMethod,
        ShippingCharges: shippingCharges,
        ShippingChargesUsd: shippingChargesUsd,
        TaxAmount: 0,
        CurrencyCode: currencyCode,
        InrPerUsd: inrPerUsd,
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
