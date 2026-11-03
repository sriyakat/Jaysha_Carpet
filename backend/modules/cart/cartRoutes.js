
const express = require("express");
const router = express.Router();

const cartController = require("../cart/cartController.js");
const customerAuth = require("../customer/customerAuthMiddleware.js");

// ======================================
// CART ROUTES
// ======================================

// Create new cart
router.post(
    "/create",
    customerAuth,
    cartController.createCart
);

// Add product to cart
router.post(
    "/:cartId/items",
    customerAuth,
    cartController.addToCart
);

// Get cart details
router.get(
    "/:cartId",
    customerAuth,
    cartController.getCart
);

// Update product quantity
router.patch(
    "/:cartId/items/:cartItemId",
    customerAuth,
    cartController.updateCartQuantity
);

// Remove product from cart
router.delete(
    "/:cartId/items/:cartItemId",
    customerAuth,
    cartController.removeFromCart
);

// Clear all products from cart
router.delete(
    "/:cartId/items",
    customerAuth,
    cartController.clearCart
);

module.exports = router;
