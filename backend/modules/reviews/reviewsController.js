const reviewService = require("./reviewsService.js");


// Common error handler
const handleError = (res, error) => {

    console.error("Review Module Error:", error);

    const sqlErrorNumber = error.number;

    const notFoundErrors = [
        50003,
        50004,
        50011,
        50013,
        50015,
        50017,
        50019
    ];

    const badRequestErrors = [
        50001, 50002, 50005, 50006,
        50007, 50008, 50009, 50010,
        50012, 50014, 50016, 50018, 50020
    ];

    if (notFoundErrors.includes(sqlErrorNumber)) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    if (badRequestErrors.includes(sqlErrorNumber)) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message === "Admin access required."
    ) {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message === "Authentication required." ||
        error.message === "User authentication required."
    ) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message === "Customer profile not found." ||
        error.message === "UserId not found in authentication token."
    ) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};


// 1. ADD REVIEW
const addReview = async (req, res) => {

    try {
        const result = await reviewService.addReview(
            req.user,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully. Waiting for admin approval.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 2. GET REVIEWS BY PRODUCT
const getReviewsByProduct = async (req, res) => {

    try {
        const result = await reviewService.getReviewsByProduct(
            Number(req.params.productId)
        );

        return res.status(200).json({
            success: true,
            message: "Product reviews fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 3. GET MY REVIEWS
const getMyReviews = async (req, res) => {

    try {
        const result = await reviewService.getMyReviews(req.user);

        return res.status(200).json({
            success: true,
            message: "Your reviews fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 4. UPDATE OWN REVIEW
const updateReview = async (req, res) => {

    try {
        const result = await reviewService.updateReview(
            req.user,
            Number(req.params.reviewId),
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Review updated successfully. Waiting for admin approval again.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 5. DELETE OWN REVIEW
const deleteReview = async (req, res) => {

    try {
        const result = await reviewService.deleteReview(
            req.user,
            Number(req.params.reviewId)
        );

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 6. ADMIN - GET ALL REVIEWS
const getAllReviews = async (req, res) => {

    try {
        const filters = {
            ProductId: req.query.productId
                ? Number(req.query.productId)
                : null,

            CustomerId: req.query.customerId
                ? Number(req.query.customerId)
                : null,

            IsApproved: req.query.isApproved !== undefined
                ? Number(req.query.isApproved)
                : null
        };

        const result = await reviewService.getAllReviews(
            req.user,
            filters
        );

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 7. ADMIN - APPROVE REVIEW
const approveReview = async (req, res) => {

    try {
        const result = await reviewService.approveReview(
            req.user,
            Number(req.params.reviewId)
        );

        return res.status(200).json({
            success: true,
            message: "Review approved successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 8. ADMIN - HIDE REVIEW
const hideReview = async (req, res) => {

    try {
        const result = await reviewService.hideReview(
            req.user,
            Number(req.params.reviewId)
        );

        return res.status(200).json({
            success: true,
            message: "Review hidden successfully.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


// 9. ADMIN - DELETE REVIEW
const adminDeleteReview = async (req, res) => {

    try {
        const result = await reviewService.adminDeleteReview(
            req.user,
            Number(req.params.reviewId)
        );

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully by admin.",
            data: result
        });

    } catch (error) {
        return handleError(res, error);
    }
};


module.exports = {
    addReview,
    getReviewsByProduct,
    getMyReviews,
    updateReview,
    deleteReview,
    getAllReviews,
    approveReview,
    hideReview,
    adminDeleteReview
};