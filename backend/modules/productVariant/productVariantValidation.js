const sendError = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};


const isValidId = (value) => {
    return (
        value !== undefined &&
        /^\d+$/.test(String(value)) &&
        Number(value) > 0 &&
        Number.isSafeInteger(Number(value))
    );
};


const validateProductId = (req, res, next) => {

    if (!isValidId(req.params.productId)) {
        return sendError(res, "Valid ProductId is required.");
    }

    next();
};


const validateVariantId = (req, res, next) => {

    if (!isValidId(req.params.productVariantId)) {
        return sendError(res, "Valid ProductVariantId is required.");
    }

    next();
};


// ADD VARIANT VALIDATION
const validateAddVariant = (req, res, next) => {

    const {
        ProductId,
        SizeLabel,
        Price,
        DiscountPrice,
        UsdPrice,
        UsdDiscountPrice,
        StockQuantity,
        IsActive
    } = req.body;

    if (!isValidId(ProductId)) {
        return sendError(res, "Valid ProductId is required.");
    }

    if (
        typeof SizeLabel !== "string" ||
        !SizeLabel.trim() ||
        SizeLabel.trim().length > 100
    ) {
        return sendError(res, "Valid SizeLabel is required (maximum 100 characters).");
    }

    if (
        Price === undefined ||
        Price === null ||
        Price === "" ||
        !Number.isFinite(Number(Price)) ||
        Number(Price) <= 0
    ) {
        return sendError(res, "Price must be greater than zero.");
    }

    if (
        DiscountPrice !== undefined &&
        DiscountPrice !== null &&
        DiscountPrice !== "" &&
        (
            !Number.isFinite(Number(DiscountPrice)) ||
            Number(DiscountPrice) < 0 ||
            Number(DiscountPrice) >= Number(Price)
        )
    ) {
        return sendError(res, "DiscountPrice must be less than Price.");
    }

    if (UsdPrice === undefined || UsdPrice === null || UsdPrice === "" || !Number.isFinite(Number(UsdPrice)) || Number(UsdPrice) <= 0) {
        return sendError(res, "UsdPrice must be greater than zero.");
    }

    if (
        UsdDiscountPrice !== undefined &&
        UsdDiscountPrice !== null &&
        UsdDiscountPrice !== "" &&
        (!Number.isFinite(Number(UsdDiscountPrice)) || Number(UsdDiscountPrice) < 0 || Number(UsdDiscountPrice) >= Number(UsdPrice))
    ) {
        return sendError(res, "UsdDiscountPrice must be less than UsdPrice.");
    }

    if (
        StockQuantity === undefined ||
        !Number.isInteger(Number(StockQuantity)) ||
        Number(StockQuantity) < 0
    ) {
        return sendError(res, "StockQuantity must be a non-negative integer.");
    }

    if (
        IsActive !== undefined &&
        typeof IsActive !== "boolean" &&
        ![0, 1].includes(IsActive)
    ) {
        return sendError(res, "IsActive must be true or false.");
    }

    next();
};


// UPDATE VARIANT VALIDATION
const validateUpdateVariant = (req, res, next) => {

    const {
        SizeLabel,
        Price,
        DiscountPrice,
        UsdPrice,
        UsdDiscountPrice,
        StockQuantity,
        IsActive
    } = req.body;

    if (
        typeof SizeLabel !== "string" ||
        !SizeLabel.trim() ||
        SizeLabel.trim().length > 100
    ) {
        return sendError(res, "Valid SizeLabel is required (maximum 100 characters).");
    }

    if (
        Price === undefined ||
        Price === null ||
        Price === "" ||
        !Number.isFinite(Number(Price)) ||
        Number(Price) <= 0
    ) {
        return sendError(res, "Price must be greater than zero.");
    }

    if (
        DiscountPrice !== undefined &&
        DiscountPrice !== null &&
        DiscountPrice !== "" &&
        (
            !Number.isFinite(Number(DiscountPrice)) ||
            Number(DiscountPrice) < 0 ||
            Number(DiscountPrice) >= Number(Price)
        )
    ) {
        return sendError(res, "DiscountPrice must be less than Price.");
    }

    if (UsdPrice === undefined || UsdPrice === null || UsdPrice === "" || !Number.isFinite(Number(UsdPrice)) || Number(UsdPrice) <= 0) {
        return sendError(res, "UsdPrice must be greater than zero.");
    }

    if (
        UsdDiscountPrice !== undefined &&
        UsdDiscountPrice !== null &&
        UsdDiscountPrice !== "" &&
        (!Number.isFinite(Number(UsdDiscountPrice)) || Number(UsdDiscountPrice) < 0 || Number(UsdDiscountPrice) >= Number(UsdPrice))
    ) {
        return sendError(res, "UsdDiscountPrice must be less than UsdPrice.");
    }

    if (
        StockQuantity === undefined ||
        !Number.isInteger(Number(StockQuantity)) ||
        Number(StockQuantity) < 0
    ) {
        return sendError(res, "StockQuantity must be a non-negative integer.");
    }

    if (
        IsActive !== undefined &&
        typeof IsActive !== "boolean" &&
        ![0, 1].includes(IsActive)
    ) {
        return sendError(res, "IsActive must be true or false.");
    }

    next();
};


// GET ALL FILTER VALIDATION
const validateFilters = (req, res, next) => {

    const { productId, isActive } = req.query;

    if (productId !== undefined && !isValidId(productId)) {
        return sendError(res, "Invalid productId filter.");
    }

    if (
        isActive !== undefined &&
        !["0", "1"].includes(String(isActive))
    ) {
        return sendError(res, "isActive must be 0 or 1.");
    }

    next();
};


module.exports = {
    validateProductId,
    validateVariantId,
    validateAddVariant,
    validateUpdateVariant,
    validateFilters
};