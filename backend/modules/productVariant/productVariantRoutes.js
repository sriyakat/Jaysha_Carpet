const express = require("express");
const router = express.Router();

const variantController = require("./productVariantController.js");

const {
    validateProductId,
    validateVariantId,
    validateAddVariant,
    validateUpdateVariant,
    validateFilters
} = require("./productVariantValidation.js");

const adminAuth = require("../customer/adminAuthMiddleware.js");


// ======================================
// PUBLIC ROUTES
// ======================================

// Product ke available sizes
router.get(
    "/product/:productId",
    validateProductId,
    variantController.getVariantsByProduct
);

// Single variant details
router.get(
    "/:productVariantId",
    validateVariantId,
    variantController.getVariantById
);


// ======================================
// ADMIN ROUTES
// ======================================

// Add new variant
router.post(
    "/",
    adminAuth,
    validateAddVariant,
    variantController.addVariant
);

// Get all variants
router.get(
    "/",
    adminAuth,
    validateFilters,
    variantController.getAllVariants
);

// Update variant
router.put(
    "/:productVariantId",
    adminAuth,
    validateVariantId,
    validateUpdateVariant,
    variantController.updateVariant
);

// Activate variant
router.patch(
    "/:productVariantId/activate",
    adminAuth,
    validateVariantId,
    variantController.activateVariant
);

// Deactivate variant
router.patch(
    "/:productVariantId/deactivate",
    adminAuth,
    validateVariantId,
    variantController.deactivateVariant
);


module.exports = router;