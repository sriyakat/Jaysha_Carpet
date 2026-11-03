const variantService = require("./productVariantService.js");


// COMMON ERROR HANDLER
const handleError = (res, error) => {

    console.error("Product Variant Error:", error);

    const notFoundErrors = [50006, 50013, 50017, 50019, 50021];

    const badRequestErrors = [
        50001, 50002, 50003, 50004, 50005,
        50007, 50008, 50009, 50010, 50011,
        50012, 50014, 50015, 50016, 50018,
        50020, 50022
    ];

    if (notFoundErrors.includes(error.number)) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    if (badRequestErrors.includes(error.number)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Admin access required.") {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Authentication required.") {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};


// 1. ADD VARIANT
const addVariant = async (req, res) => {
    try {
        const result = await variantService.addVariant(
            req.user,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Product variant created successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 2. UPDATE VARIANT
const updateVariant = async (req, res) => {
    try {
        const result = await variantService.updateVariant(
            req.user,
            Number(req.params.productVariantId),
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Product variant updated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 3. GET VARIANTS BY PRODUCT
const getVariantsByProduct = async (req, res) => {
    try {
        const result = await variantService.getVariantsByProduct(
            Number(req.params.productId)
        );

        return res.status(200).json({
            success: true,
            message: "Product variants fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 4. GET VARIANT BY ID
const getVariantById = async (req, res) => {
    try {
        const result = await variantService.getVariantById(
            Number(req.params.productVariantId)
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Product variant not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product variant fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 5. GET ALL VARIANTS - ADMIN
const getAllVariants = async (req, res) => {
    try {
        const filters = {
            ProductId: req.query.productId
                ? Number(req.query.productId)
                : null,

            IsActive: req.query.isActive !== undefined
                ? Number(req.query.isActive)
                : null
        };

        const result = await variantService.getAllVariants(
            req.user,
            filters
        );

        return res.status(200).json({
            success: true,
            message: "All product variants fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 6. ACTIVATE VARIANT
const activateVariant = async (req, res) => {
    try {
        const result = await variantService.activateVariant(
            req.user,
            Number(req.params.productVariantId)
        );

        return res.status(200).json({
            success: true,
            message: "Product variant activated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 7. DEACTIVATE VARIANT
const deactivateVariant = async (req, res) => {
    try {
        const result = await variantService.deactivateVariant(
            req.user,
            Number(req.params.productVariantId)
        );

        return res.status(200).json({
            success: true,
            message: "Product variant deactivated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


module.exports = {
    addVariant,
    updateVariant,
    getVariantsByProduct,
    getVariantById,
    getAllVariants,
    activateVariant,
    deactivateVariant
};