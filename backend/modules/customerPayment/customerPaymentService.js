const crypto = require("node:crypto");
const orderRepository = require("../customerOrder/customerOrderRepository.js");
const paymentRepository = require("../payment/paymentRepository.js");

const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

const getCredentials = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        const error = new Error("Online payments are not configured. Add Razorpay credentials to the backend environment.");
        error.statusCode = 503;
        throw error;
    }

    return { keyId, keySecret };
};

const validateId = (value, fieldName) => {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error(`${fieldName} must be a valid positive integer.`);
        error.statusCode = 400;
        throw error;
    }

    return id;
};

const getProperty = (record, ...names) => {
    for (const name of names) {
        if (record?.[name] !== undefined && record[name] !== null) {
            return record[name];
        }
    }

    return undefined;
};

const gatewayRequest = async (path, method, keyId, keySecret, body) => {
    const response = await fetch(`${RAZORPAY_API_URL}${path}`, {
        method,
        headers: {
            Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
            ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
        const message = result?.error?.description || "Razorpay could not process the payment request.";
        const error = new Error(message);
        error.statusCode = response.status >= 500 ? 502 : 400;
        throw error;
    }

    return result;
};

const getOwnedOnlineOrder = async (customerId, orderId) => {
    const result = await orderRepository.getOrderById(customerId, orderId);

    if (!result.order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
    }

    const paymentMethod = String(getProperty(result.order, "PaymentMethod", "paymentMethod") || "").toUpperCase();
    if (paymentMethod !== "ONLINE") {
        const error = new Error("This order is not set up for online payment.");
        error.statusCode = 400;
        throw error;
    }

    const orderStatus = String(getProperty(result.order, "OrderStatus", "orderStatus") || "").toUpperCase();
    if (orderStatus === "CANCELLED") {
        const error = new Error("Cancelled orders cannot be paid.");
        error.statusCode = 409;
        throw error;
    }

    return result;
};

const getOrderAmount = (order) => {
    const amount = Number(getProperty(order, "GrandTotal", "grandTotal", "TotalAmount", "totalAmount"));

    if (!Number.isFinite(amount) || amount <= 0) {
        const error = new Error("The order has an invalid total and cannot be paid online.");
        error.statusCode = 400;
        throw error;
    }

    return Math.round(amount * 100);
};

const getConfig = () => ({
    enabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    keyId: process.env.RAZORPAY_KEY_ID || null
});

const createRazorpayOrder = async (customerId, rawOrderId) => {
    customerId = validateId(customerId, "CustomerId");
    const orderId = validateId(rawOrderId, "OrderId");
    const { keyId, keySecret } = getCredentials();
    const { order } = await getOwnedOnlineOrder(customerId, orderId);

    const paymentStatus = String(getProperty(order, "PaymentStatus", "paymentStatus") || "").toUpperCase();
    const existingPayments = await paymentRepository.getPaymentsByOrder(orderId);
    const confirmedPayment = existingPayments.find((payment) =>
        String(getProperty(payment, "GatewayName", "gatewayName") || "").toLowerCase() === "razorpay"
        && getProperty(payment, "GatewayPaymentId", "gatewayPaymentId")
        && getProperty(payment, "GatewaySignature", "gatewaySignature"),
    );

    if (confirmedPayment) {
        if (String(getProperty(confirmedPayment, "PaymentStatus", "paymentStatus") || "").toUpperCase() !== "SUCCESS") {
            await paymentRepository.updatePaymentStatus({
                PaymentId: confirmedPayment.PaymentId,
                PaymentStatus: "SUCCESS"
            });
        }
        if (paymentStatus !== "PAID") {
            await orderRepository.updatePaymentStatus({
                OrderId: orderId,
                PaymentStatus: "PAID"
            });
        }
        return { alreadyPaid: true, orderId };
    }

    if (paymentStatus === "PAID") {
        return { alreadyPaid: true, orderId };
    }

    const amount = getOrderAmount(order);
    const pendingPayment = existingPayments.find((payment) => {
        const gatewayName = String(getProperty(payment, "GatewayName", "gatewayName") || "").toLowerCase();
        return String(getProperty(payment, "PaymentStatus", "paymentStatus") || "").toUpperCase() === "PENDING"
            && String(getProperty(payment, "PaymentMethod", "paymentMethod") || "").toUpperCase() === "ONLINE"
            && (!gatewayName || gatewayName === "razorpay");
    });

    if (pendingPayment && getProperty(pendingPayment, "GatewayOrderId", "gatewayOrderId")) {
        await paymentRepository.updateGatewayDetails({
            PaymentId: pendingPayment.PaymentId,
            GatewayName: "Razorpay",
            GatewayOrderId: getProperty(pendingPayment, "GatewayOrderId", "gatewayOrderId")
        });
        return {
            keyId,
            orderId: getProperty(pendingPayment, "GatewayOrderId", "gatewayOrderId"),
            amount,
            currency: "INR"
        };
    }

    const payment = pendingPayment || await paymentRepository.createPayment({
        OrderId: orderId,
        PaymentMethod: "ONLINE",
        Amount: amount / 100
    });

    if (!payment?.PaymentId) {
        throw new Error("The payment record could not be saved for this order.");
    }

    const gatewayOrder = await gatewayRequest("/orders", "POST", keyId, keySecret, {
        amount,
        currency: "INR",
        receipt: `jaysha-${orderId}-${Date.now()}`,
        notes: { orderId: String(orderId) }
    });

    await paymentRepository.updateGatewayDetails({
        PaymentId: payment.PaymentId,
        GatewayName: "Razorpay",
        GatewayOrderId: gatewayOrder.id
    });

    return {
        keyId,
        orderId: gatewayOrder.id,
        amount,
        currency: "INR"
    };
};

const verifyRazorpayPayment = async (customerId, rawOrderId, details) => {
    customerId = validateId(customerId, "CustomerId");
    const orderId = validateId(rawOrderId, "OrderId");

    const razorpayOrderId = String(details?.razorpay_order_id || "");
    const razorpayPaymentId = String(details?.razorpay_payment_id || "");
    const razorpaySignature = String(details?.razorpay_signature || "");

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        const error = new Error("Razorpay payment verification details are incomplete.");
        error.statusCode = 400;
        throw error;
    }

    const { keyId, keySecret } = getCredentials();
    const { order } = await getOwnedOnlineOrder(customerId, orderId);
    const payments = await paymentRepository.getPaymentsByOrder(orderId);
    const payment = payments.find((item) =>
        String(getProperty(item, "GatewayName", "gatewayName") || "").toLowerCase() === "razorpay"
        && String(getProperty(item, "GatewayOrderId", "gatewayOrderId") || "") === razorpayOrderId,
    );

    if (!payment) {
        const error = new Error("The Razorpay order does not belong to this customer order.");
        error.statusCode = 400;
        throw error;
    }

    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest();
    const receivedSignature = Buffer.from(razorpaySignature, "hex");

    if (
        receivedSignature.length !== expectedSignature.length
        || !crypto.timingSafeEqual(receivedSignature, expectedSignature)
    ) {
        const error = new Error("Razorpay payment signature is invalid.");
        error.statusCode = 400;
        throw error;
    }

    let providerPayment = await gatewayRequest(
        `/payments/${encodeURIComponent(razorpayPaymentId)}`,
        "GET",
        keyId,
        keySecret,
    );
    const expectedAmount = getOrderAmount(order);

    if (
        providerPayment.order_id === razorpayOrderId
        && Number(providerPayment.amount) === expectedAmount
        && providerPayment.currency === "INR"
        && providerPayment.status === "authorized"
    ) {
        providerPayment = await gatewayRequest(
            `/payments/${encodeURIComponent(razorpayPaymentId)}/capture`,
            "POST",
            keyId,
            keySecret,
            { amount: expectedAmount, currency: "INR" },
        );
    }

    if (
        providerPayment.order_id !== razorpayOrderId
        || Number(providerPayment.amount) !== expectedAmount
        || providerPayment.currency !== "INR"
        || providerPayment.status !== "captured"
    ) {
        const error = new Error("Razorpay has not confirmed a captured payment for this order.");
        error.statusCode = 409;
        throw error;
    }

    await paymentRepository.updateGatewayDetails({
        PaymentId: payment.PaymentId,
        GatewayName: "Razorpay",
        GatewayOrderId: razorpayOrderId,
        GatewayPaymentId: razorpayPaymentId,
        GatewaySignature: razorpaySignature
    });
    await paymentRepository.updatePaymentStatus({
        PaymentId: payment.PaymentId,
        PaymentStatus: "SUCCESS"
    });
    await orderRepository.updatePaymentStatus({
        OrderId: orderId,
        PaymentStatus: "PAID"
    });

    return {
        order: { ...order, PaymentStatus: "PAID" },
        paymentId: payment.PaymentId
    };
};

module.exports = {
    getConfig,
    createRazorpayOrder,
    verifyRazorpayPayment
};
