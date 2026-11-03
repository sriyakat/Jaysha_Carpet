const express = require("express");
const router = express.Router();

const reviewController = require("./reviewsController.js");

const {
    validateProductId,
    validateAddReview,
    validateReviewId,
    validateUpdateReview,
    validateAdminFilters
} = require("./reviewsValidation.js");

const customerAuth = require("../customer/customerAuthMiddleware.js");
const adminAuth = require("../customer/adminAuthMiddleware.js");


// ========================================
// PUBLIC ROUTE
// ========================================

// GET approved reviews of a product
router.get(
    "/product/:productId",
    validateProductId,
    reviewController.getReviewsByProduct
);


// ========================================
// CUSTOMER ROUTES
// ========================================

// Add review
router.post(
    "/",
    customerAuth,
    validateAddReview,
    reviewController.addReview
);

// Get logged-in customer's reviews
router.get(
    "/my",
    customerAuth,
    reviewController.getMyReviews
);

// Update own review
router.put(
    "/:reviewId",
    customerAuth,
    validateReviewId,
    validateUpdateReview,
    reviewController.updateReview
);

// Delete own review
router.delete(
    "/:reviewId",
    customerAuth,
    validateReviewId,
    reviewController.deleteReview
);


// ========================================
// ADMIN ROUTES
// ========================================

// Get all reviews with optional filters
router.get(
    "/admin",
    adminAuth,
    validateAdminFilters,
    reviewController.getAllReviews
);

// Approve review
router.patch(
    "/admin/:reviewId/approve",
    adminAuth,
    validateReviewId,
    reviewController.approveReview
);

// Hide review
router.patch(
    "/admin/:reviewId/hide",
    adminAuth,
    validateReviewId,
    reviewController.hideReview
);

// Delete any review
router.delete(
    "/admin/:reviewId",
    adminAuth,
    validateReviewId,
    reviewController.adminDeleteReview
);


module.exports = router;