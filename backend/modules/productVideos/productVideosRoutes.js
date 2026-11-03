const express = require("express");
const router = express.Router();

const controller = require("./productVideosController.js");
const validation = require("./productVideosValidation.js");
const adminAuth = require("../customer/adminAuthMiddleware.js");

// Admin: Add video
router.post(
    "/",
    adminAuth,
    validation.validateAddProductVideo,
    controller.addProductVideo
);

// Admin: Update video
router.put(
    "/:productVideoId",
    adminAuth,
    validation.validateId,
    validation.validateUpdateProductVideo,
    controller.updateProductVideo
);

// Public: Get video by product
router.get(
    "/product/:productId",
    validation.validateProductId,
    controller.getProductVideoByProduct
);

// Admin: Get all videos
router.get(
    "/",
    adminAuth,
    validation.validateFilters,
    controller.getAllProductVideos
);

// Admin: Get video by ID
router.get(
    "/:productVideoId",
    adminAuth,
    validation.validateId,
    controller.getProductVideoById
);

// Admin: Delete video
router.delete(
    "/:productVideoId",
    adminAuth,
    validation.validateId,
    controller.deleteProductVideo
);

module.exports = router;