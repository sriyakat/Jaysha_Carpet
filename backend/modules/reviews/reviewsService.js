const reviewRepository = require("./reviewsRepository.js");


// Customer token se CustomerId nikalna
const getLoggedInCustomerId = async (user) => {

    if (!user) {
        throw new Error("User authentication required.");
    }

    // Agar token mein CustomerId available hai
    const customerId = user.CustomerId || user.customerId;

    if (customerId) {
        return Number(customerId);
    }

    // Otherwise token ki UserId se CustomerId find karenge
    const userId = user.UserId || user.userId || user.id;

    if (!userId || !Number.isInteger(Number(userId))) {
        throw new Error("UserId not found in authentication token.");
    }

    const customer = await reviewRepository.getCustomerIdByUserId(
        Number(userId)
    );

    if (!customer) {
        throw new Error("Customer profile not found.");
    }

    return customer;
};


// Admin access check
const checkAdmin = (user) => {

    if (!user) {
        throw new Error("Authentication required.");
    }

    const role = (
        user.RoleName ||
        user.Role ||
        user.roleName ||
        user.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Admin access required.");
    }
};


// 1. ADD REVIEW
const addReview = async (user, data) => {

    const customerId = await getLoggedInCustomerId(user);

    return await reviewRepository.addReview({
        ProductId: data.ProductId,
        CustomerId: customerId,
        OrderItemId: data.OrderItemId || null,
        Rating: data.Rating,
        ReviewText: data.ReviewText || null
    });
};


// 2. GET REVIEWS BY PRODUCT
const getReviewsByProduct = async (productId) => {

    return await reviewRepository.getReviewsByProduct(productId);
};


// 3. GET CUSTOMER'S OWN REVIEWS
const getMyReviews = async (user) => {

    const customerId = await getLoggedInCustomerId(user);

    return await reviewRepository.getReviewsByCustomer(customerId);
};


// 4. UPDATE OWN REVIEW
const updateReview = async (user, reviewId, data) => {

    const customerId = await getLoggedInCustomerId(user);

    return await reviewRepository.updateReview({
        ReviewId: reviewId,
        CustomerId: customerId,
        Rating: data.Rating,
        ReviewText: data.ReviewText || null
    });
};


// 5. DELETE OWN REVIEW
const deleteReview = async (user, reviewId) => {

    const customerId = await getLoggedInCustomerId(user);

    return await reviewRepository.deleteReview(
        reviewId,
        customerId
    );
};


// 6. ADMIN - GET ALL REVIEWS
const getAllReviews = async (user, filters) => {

    checkAdmin(user);

    return await reviewRepository.getAllReviews(filters);
};


// 7. ADMIN - APPROVE REVIEW
const approveReview = async (user, reviewId) => {

    checkAdmin(user);

    return await reviewRepository.approveReview(reviewId);
};


// 8. ADMIN - HIDE REVIEW
const hideReview = async (user, reviewId) => {

    checkAdmin(user);

    return await reviewRepository.hideReview(reviewId);
};


// 9. ADMIN - DELETE REVIEW
const adminDeleteReview = async (user, reviewId) => {

    checkAdmin(user);

    return await reviewRepository.adminDeleteReview(reviewId);
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