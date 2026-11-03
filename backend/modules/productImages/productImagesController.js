
const productImageService = require("../productImages/productImagesService");
const {
    saveProductImage,
    deleteProductImageFile
} = require("./productImageStorage");

function handleError(error, res, next) {
    if (error.statusCode === 400) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return next(error);
}

// ======================================
// 1. ADD PRODUCT IMAGE
// ======================================
const addProductImage = async (req, res, next) => {
    let savedImage;

    try {
        if (!req.file) {
            const error = new Error("Select an image file to upload.");
            error.statusCode = 400;
            throw error;
        }

        const productId = Number(req.params.productId);
        if (!Number.isInteger(productId) || productId <= 0) {
            const error = new Error("Valid ProductId is required.");
            error.statusCode = 400;
            throw error;
        }

        if (req.body?.IsPrimary !== undefined && !["true", "false"].includes(req.body.IsPrimary)) {
            const error = new Error("IsPrimary must be true or false.");
            error.statusCode = 400;
            throw error;
        }

        savedImage = await saveProductImage(productId, req.file);

        const imageData = {
            ProductId: productId,
            ...savedImage,
            OriginalFileName: require("node:path").basename(req.file.originalname).slice(0, 255),
            IsPrimary: req.body?.IsPrimary === "true",
            DisplayOrder: req.body?.DisplayOrder === undefined
                ? undefined
                : Number(req.body.DisplayOrder)
        };

        const result = await productImageService.addProductImage(imageData);

        return res.status(201).json({
            success: true,
            message: "Product image added successfully.",
            data: result
        });

    } catch (error) {
        if (savedImage) {
            try {
                await deleteProductImageFile(savedImage.StorageKey);
            } catch (cleanupError) {
                cleanupError.cause = error;
                return next(cleanupError);
            }
        }

        return handleError(error, res, next);
    }
};


// ======================================
// 2. GET PRODUCT IMAGES
// ======================================
const getProductImages = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);

        const result = await productImageService.getProductImages(productId);

        return res.status(200).json({
            success: true,
            message: "Product images fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(error, res, next);
    }
};


// ======================================
// 3. SET PRIMARY IMAGE
// ======================================
const setPrimaryImage = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const productImageId = Number(req.params.productImageId);

        const result = await productImageService.setPrimaryImage(
            productId,
            productImageId
        );

        return res.status(200).json({
            success: true,
            message: "Primary image updated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(error, res, next);
    }
};


// ======================================
// 4. UPDATE IMAGE ORDER
// ======================================
const updateImageOrder = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const productImageId = Number(req.params.productImageId);
        const displayOrder = req.body?.DisplayOrder === undefined
            ? undefined
            : Number(req.body.DisplayOrder);

        const result = await productImageService.updateImageOrder(
            productId,
            productImageId,
            displayOrder
        );

        return res.status(200).json({
            success: true,
            message: "Product image order updated successfully.",
            data: result
        });

    } catch (error) {
        return handleError(error, res, next);
    }
};


// ======================================
// 5. DELETE PRODUCT IMAGE
// ======================================
const deleteProductImage = async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const productImageId = Number(req.params.productImageId);
        const images = await productImageService.getProductImages(productId);
        const image = images.find((item) =>
            Number(item.ProductImageId ?? item.productImageId) === productImageId
        );

        const result = await productImageService.deleteProductImage(
            productId,
            productImageId
        );

        if (image?.StorageKey || image?.storageKey) {
            await deleteProductImageFile(image.StorageKey ?? image.storageKey);
        }

        return res.status(200).json({
            success: true,
            message: "Product image deleted successfully.",
            data: result
        });

    } catch (error) {
        return handleError(error, res, next);
    }
};


// ======================================
// EXPORT CONTROLLERS
// ======================================
module.exports = {
    addProductImage,
    getProductImages,
    setPrimaryImage,
    updateImageOrder,
    deleteProductImage
};
