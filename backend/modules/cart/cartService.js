
const cartRepository = require("../cart/cartRepository.js");

const badRequest = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

// ======================================
// 1. CREATE CART
// ======================================
const createCart = async (cartData) => {
    if (!cartData || typeof cartData !== "object") {
        throw badRequest("Cart details are required.");
    }

    const hasCustomer = cartData.CustomerId !== null && cartData.CustomerId !== undefined;
    if (hasCustomer && !isPositiveInteger(cartData.CustomerId)) {
        const error = new Error("Valid CustomerId is required.");
        error.statusCode = 401;
        throw error;
    }

    if (!hasCustomer && !/^[a-f0-9]{64}$/i.test(cartData.CartToken || "")) {
        throw badRequest("Valid CartToken is required.");
    }

    return await cartRepository.createCart(cartData);
};


// ======================================
// 2. ADD TO CART
// ======================================
const addToCart = async (cartData) => {
    if (!isPositiveInteger(cartData.CartId)) {
        throw badRequest("Valid CartId is required.");
    }

    if (!isPositiveInteger(cartData.ProductId)) {
        throw badRequest("Valid ProductId is required.");
    }

    if (cartData.ProductVariantId != null && !isPositiveInteger(cartData.ProductVariantId)) {
        throw badRequest("Valid ProductVariantId is required.");
    }

    if (
        (cartData.CustomerId == null && !/^[a-f0-9]{64}$/i.test(cartData.CartToken || ""))
        || (cartData.CustomerId != null && !isPositiveInteger(cartData.CustomerId))
    ) {
        const error = new Error("Valid cart ownership credentials are required.");
        error.statusCode = 401;
        throw error;
    }

    if (!Number.isInteger(cartData.Quantity) || cartData.Quantity <= 0) {
        throw badRequest("Quantity must be a positive integer.");
    }

    return await cartRepository.addToCart(cartData);
};


// ======================================
// 3. GET CART
// ======================================
const getCart = async (cartData) => {
    validateCartAccess(cartData);
    return await cartRepository.getCart(cartData);
};


// ======================================
// 4. UPDATE QUANTITY
// ======================================
const updateCartQuantity = async (cartData) => {
    validateCartAccess(cartData);
    if (!isPositiveInteger(cartData.CartItemId)) {
        throw badRequest("Valid CartItemId is required.");
    }

    if (!Number.isInteger(cartData.Quantity) || cartData.Quantity <= 0) {
        throw badRequest("Quantity must be a positive integer.");
    }

    return await cartRepository.updateCartQuantity(cartData);
};


// ======================================
// 5. REMOVE FROM CART
// ======================================
const removeFromCart = async (cartData) => {
    validateCartAccess(cartData);
    if (!isPositiveInteger(cartData.CartItemId)) {
        throw badRequest("Valid CartItemId is required.");
    }

    return await cartRepository.removeFromCart(cartData);
};


// ======================================
// 6. CLEAR CART
// ======================================
const clearCart = async (cartData) => {
    validateCartAccess(cartData);
    return await cartRepository.clearCart(cartData);
};

function validateCartAccess(cartData) {
    if (!isPositiveInteger(cartData.CartId)) {
        throw badRequest("Valid CartId is required.");
    }

    if (
        (cartData.CustomerId == null && !/^[a-f0-9]{64}$/i.test(cartData.CartToken || ""))
        || (cartData.CustomerId != null && !isPositiveInteger(cartData.CustomerId))
    ) {
        const error = new Error("Valid cart ownership credentials are required.");
        error.statusCode = 401;
        throw error;
    }
}


module.exports = {
    createCart,
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};
