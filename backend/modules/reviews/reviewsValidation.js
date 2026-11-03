// Common ID validation
const validateId = (value) => {
    return (
        value !== undefined &&
        value !== null &&
        /^\d+$/.test(String(value)) &&
        Number(value) > 0 &&
        Number.isSafeInteger(Number(value))
    );
};


// Common error response
const sendValidationError = (res, message) => {
    return res.status(400).json({
        success: false,
        message
    });
};


// Validate ProductId
const validateProductId = (req, res, next) => {

    if (!validateId(req.params.productId)) {
        return sendValidationError(res, "Valid ProductId is required.");
    }

    next();
};


// Validate Add Review
const validateAddReview = (req, res, next) => {

    const { ProductId, OrderItemId, Rating, ReviewText } = req.body;

    if (!validateId(ProductId)) {
        return sendValidationError(res, "Valid ProductId is required.");
    }

    if (
        Rating === undefined ||
        !Number.isInteger(Number(Rating)) ||
        Number(Rating) < 1 ||
        Number(Rating) > 5
    ) {
        return sendValidationError(res, "Rating must be between 1 and 5.");
    }

    if (
        OrderItemId !== undefined &&
        OrderItemId !== null &&
        OrderItemId !== "" &&
        !validateId(OrderItemId)
    ) {
        return sendValidationError(res, "Valid OrderItemId is required.");
    }

    if (
        ReviewText !== undefined &&
        ReviewText !== null &&
        typeof ReviewText !== "string"
    ) {
        return sendValidationError(res, "ReviewText must be a string.");
    }

    if (ReviewText && ReviewText.length > 1000) {
        return sendValidationError(
            res,
            "ReviewText cannot exceed 1000 characters."
        );
    }

    next();
};


// Validate ReviewId
const validateReviewId = (req, res, next) => {

    if (!validateId(req.params.reviewId)) {
        return sendValidationError(res, "Valid ReviewId is required.");
    }

    next();
};


// Validate Update Review
const validateUpdateReview = (req, res, next) => {

    const { Rating, ReviewText } = req.body;

    if (
        Rating === undefined ||
        !Number.isInteger(Number(Rating)) ||
        Number(Rating) < 1 ||
        Number(Rating) > 5
    ) {
        return sendValidationError(res, "Rating must be between 1 and 5.");
    }

    if (
        ReviewText !== undefined &&
        ReviewText !== null &&
        typeof ReviewText !== "string"
    ) {
        return sendValidationError(res, "ReviewText must be a string.");
    }

    if (ReviewText && ReviewText.length > 1000) {
        return sendValidationError(
            res,
            "ReviewText cannot exceed 1000 characters."
        );
    }

    next();
};


// Validate Admin Review Filters
const validateAdminFilters = (req, res, next) => {

    const { productId, customerId, isApproved } = req.query;

    if (productId !== undefined && !validateId(productId)) {
        return sendValidationError(res, "Invalid productId filter.");
    }

    if (customerId !== undefined && !validateId(customerId)) {
        return sendValidationError(res, "Invalid customerId filter.");
    }

    if (
        isApproved !== undefined &&
        !["0", "1"].includes(String(isApproved))
    ) {
        return sendValidationError(
            res,
            "isApproved must be 0 or 1."
        );
    }

    next();
};


module.exports = {
    validateProductId,
    validateAddReview,
    validateReviewId,
    validateUpdateReview,
    validateAdminFilters
};