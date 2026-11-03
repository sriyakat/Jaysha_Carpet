
const productImageRepository = require("../productImages/productImagesRepository");
const MAX_PRODUCT_IMAGES = 8;

const badRequest = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
};

const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

// ======================================
// 1. ADD PRODUCT IMAGE
// ======================================
const addProductImage = async (imageData) => {
    if (!imageData || !isPositiveInteger(imageData.ProductId)) {
        throw badRequest("Valid ProductId is required.");
    }

    if (typeof imageData.StorageKey !== "string" || !imageData.StorageKey.trim()) {
        throw badRequest("StorageKey is required.");
    }

    if (
        imageData.FileSize != null
        && (!Number.isSafeInteger(Number(imageData.FileSize)) || Number(imageData.FileSize) < 0)
    ) {
        throw badRequest("FileSize must be a non-negative integer.");
    }

    if (imageData.IsPrimary != null && typeof imageData.IsPrimary !== "boolean") {
        throw badRequest("IsPrimary must be true or false.");
    }

    if (
        imageData.OriginalFileName != null
        && (typeof imageData.OriginalFileName !== "string" || imageData.OriginalFileName.length > 255)
    ) {
        throw badRequest("OriginalFileName must be 255 characters or fewer.");
    }

    if (
        imageData.FileType != null
        && (typeof imageData.FileType !== "string" || imageData.FileType.length > 50)
    ) {
        throw badRequest("FileType must be 50 characters or fewer.");
    }

    if (
        imageData.DisplayOrder != null
        && (!Number.isInteger(Number(imageData.DisplayOrder)) || Number(imageData.DisplayOrder) < 0)
    ) {
        throw badRequest("DisplayOrder must be a non-negative integer.");
    }

    const images = await productImageRepository.getProductImages(imageData.ProductId);
    if (images.length >= MAX_PRODUCT_IMAGES) {
        throw badRequest(`A product can have up to ${MAX_PRODUCT_IMAGES} images.`);
    }

    return await productImageRepository.addProductImage(imageData);
};


// ======================================
// 2. GET PRODUCT IMAGES
// ======================================
const getProductImages = async (productId) => {
    if (!isPositiveInteger(productId)) {
        throw badRequest("Valid ProductId is required.");
    }

    return await productImageRepository.getProductImages(productId);
};


// ======================================
// 3. SET PRIMARY IMAGE
// ======================================
const setPrimaryImage = async (productId, productImageId) => {
    if (!isPositiveInteger(productId)) {
        throw badRequest("Valid ProductId is required.");
    }

    if (!isPositiveInteger(productImageId)) {
        throw badRequest("Valid ProductImageId is required.");
    }

    return await productImageRepository.setPrimaryImage(
        productId,
        productImageId
    );
};


// ======================================
// 4. UPDATE IMAGE ORDER
// ======================================
const updateImageOrder = async (productId, productImageId, displayOrder) => {
    if (!isPositiveInteger(productId)) {
        throw badRequest("Valid ProductId is required.");
    }

    if (!isPositiveInteger(productImageId)) {
        throw badRequest("Valid ProductImageId is required.");
    }

    if (displayOrder === undefined || displayOrder === null || !Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0) {
        throw badRequest("DisplayOrder must be a non-negative integer.");
    }

    return await productImageRepository.updateImageOrder(
        productId,
        productImageId,
        Number(displayOrder)
    );
};


// ======================================
// 5. DELETE PRODUCT IMAGE
// ======================================
const deleteProductImage = async (productId, productImageId) => {
    if (!isPositiveInteger(productId)) {
        throw badRequest("Valid ProductId is required.");
    }

    if (!isPositiveInteger(productImageId)) {
        throw badRequest("Valid ProductImageId is required.");
    }

    return await productImageRepository.deleteProductImage(
        productId,
        productImageId
    );
};


// ======================================
// EXPORT FUNCTIONS
// ======================================
module.exports = {
    addProductImage,
    getProductImages,
    setPrimaryImage,
    updateImageOrder,
    deleteProductImage
};
