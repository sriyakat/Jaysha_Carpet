
const express = require("express");
const router = express.Router();

const productImageController = require("../productImages/productImagesController");
const uploadProductImage = require("./productImageUpload");
const adminAuth = require("../customer/adminAuthMiddleware");

// ======================================
// PRODUCT IMAGE ROUTES
// ======================================

// Add product image
router.post("/:productId", adminAuth, uploadProductImage, productImageController.addProductImage);

// Get all images of a product
router.get("/:productId", productImageController.getProductImages);

// Set primary image
router.patch(
    "/:productId/:productImageId/primary",
    adminAuth,
    productImageController.setPrimaryImage
);

// Update image display order
router.patch(
    "/:productId/:productImageId/order",
    adminAuth,
    productImageController.updateImageOrder
);

// Delete product image
router.delete(
    "/:productId/:productImageId",
    adminAuth,
    productImageController.deleteProductImage
);

module.exports = router;
