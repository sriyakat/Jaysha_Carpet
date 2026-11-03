
const crypto = require("crypto");
const cartService = require("../cart/cartService.js");

const createError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// ======================================
// COMMON HELPERS
// ======================================

// Validate positive integer
const getPositiveId = (value) => {
    if (
        typeof value === "string"
        && !/^[0-9]+$/.test(value)
    ) {
        return null;
    }

    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
};


// Get cart ownership details
const getCartAccess = (req) => {
    // CustomerId must come from authenticated user.
    const customerId = req.user?.CustomerId;

    // Guest token comes from request header.
    const cartToken = req.get("x-cart-token")?.trim();

    if (customerId !== undefined && customerId !== null) {
        const validCustomerId = getPositiveId(customerId);
        if (!validCustomerId) {
            throw createError("Authenticated customer ID is invalid.", 401);
        }

        return {
            CustomerId: validCustomerId,
            CartToken: null
        };
    }

    if (cartToken) {
        if (!/^[a-f0-9]{64}$/i.test(cartToken)) {
            throw createError("CartToken is invalid.", 401);
        }

        return {
            CustomerId: null,
            CartToken: cartToken
        };
    }

    throw createError("Customer authentication or CartToken is required.", 401);
};


// Common error response
const handleError = (res, error) => {
    console.error("Cart Error:", error);

    let statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;

    if (!error?.statusCode && (
        error?.number >= 50001 &&
        error?.number <= 50016
    )) {
        statusCode = error?.number === 50005 ? 404 : 400;
    }
    if (!error?.statusCode && error?.number === 50018) statusCode = 404;
    if (!error?.statusCode && error?.number === 50019) statusCode = 400;
    if (!error?.statusCode && error?.number === 50020) statusCode = 400;

    return res.status(statusCode).json({
        success: false,
        message: error?.message || "Something went wrong."
    });
};


// ======================================
// 1. CREATE CART
// ======================================
const createCart = async (req, res) => {
    try {
        const customerId = req.user?.CustomerId == null
            ? null
            : getPositiveId(req.user.CustomerId);
        if (req.user?.CustomerId != null && !customerId) {
            throw createError("Authenticated customer ID is invalid.", 401);
        }

        // Server generates a secure CartToken.
        const cartToken = crypto.randomBytes(32).toString("hex");

        const cartData = {
            CustomerId: customerId,
            CartToken: cartToken
        };

        const result = await cartService.createCart(cartData);

        return res.status(201).json({
            success: true,
            message: "Cart created successfully.",
            data: result,
            cartToken: customerId ? null : cartToken
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 2. ADD PRODUCT TO CART
// ======================================
const addToCart = async (req, res) => {
    try {
        const cartId = getPositiveId(req.params.cartId);
        const productId = getPositiveId(req.body?.ProductId);
        const quantity = Number(req.body?.Quantity ?? 1);

        if (!cartId || !productId) {
            throw createError("Valid CartId and ProductId are required.", 400);
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw createError("Quantity must be a positive integer.", 400);
        }

        const cartData = {
            CartId: cartId,
            ...getCartAccess(req),
            ProductId: productId,
            Quantity: quantity
        };

        const result = await cartService.addToCart(cartData);

        return res.status(200).json({
            success: true,
            message: "Product added to cart successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 3. GET CART
// ======================================
const getCart = async (req, res) => {
    try {
        const cartId = getPositiveId(req.params.cartId);

        if (!cartId) {
            throw createError("Valid CartId is required.", 400);
        }

        const cartData = {
            CartId: cartId,
            ...getCartAccess(req)
        };

        const result = await cartService.getCart(cartData);

        return res.status(200).json({
            success: true,
            message: "Cart fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 4. UPDATE CART QUANTITY
// ======================================
const updateCartQuantity = async (req, res) => {
    try {
        const cartId = getPositiveId(req.params.cartId);
        const cartItemId = getPositiveId(req.params.cartItemId);
        const quantity = Number(req.body?.Quantity);

        if (!cartId || !cartItemId) {
            throw createError("Valid CartId and CartItemId are required.", 400);
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw createError("Quantity must be a positive integer.", 400);
        }

        const cartData = {
            CartId: cartId,
            ...getCartAccess(req),
            CartItemId: cartItemId,
            Quantity: quantity
        };

        const result = await cartService.updateCartQuantity(cartData);

        return res.status(200).json({
            success: true,
            message: "Cart quantity updated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 5. REMOVE PRODUCT FROM CART
// ======================================
const removeFromCart = async (req, res) => {
    try {
        const cartId = getPositiveId(req.params.cartId);
        const cartItemId = getPositiveId(req.params.cartItemId);

        if (!cartId || !cartItemId) {
            throw createError("Valid CartId and CartItemId are required.", 400);
        }

        const cartData = {
            CartId: cartId,
            ...getCartAccess(req),
            CartItemId: cartItemId
        };

        const result = await cartService.removeFromCart(cartData);

        return res.status(200).json({
            success: true,
            message: "Product removed from cart successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 6. CLEAR CART
// ======================================
const clearCart = async (req, res) => {
    try {
        const cartId = getPositiveId(req.params.cartId);

        if (!cartId) {
            throw createError("Valid CartId is required.", 400);
        }

        const cartData = {
            CartId: cartId,
            ...getCartAccess(req)
        };

        const result = await cartService.clearCart(cartData);

        return res.status(200).json({
            success: true,
            message: "Cart cleared successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


module.exports = {
    createCart,
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};
