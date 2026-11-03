const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// 1. Customer ki UserId se CustomerId nikalna
const getCustomerIdByUserId = async (userId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("UserId", sql.Int, userId)
        .query(`
            SELECT TOP 1 CustomerId
            FROM dbo.Customers
            WHERE UserId = @UserId
        `);

    return result.recordset[0]?.CustomerId || null;
};


// 2. ADD REVIEW
const addReview = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("ProductId", sql.Int, data.ProductId)
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("OrderItemId", sql.BigInt, data.OrderItemId || null)
        .input("Rating", sql.TinyInt, data.Rating)
        .input("ReviewText", sql.NVarChar(1000), data.ReviewText || null)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


// 3. GET APPROVED REVIEWS BY PRODUCT
const getReviewsByProduct = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset;
};


// 4. GET CUSTOMER'S OWN REVIEWS
const getReviewsByCustomer = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_CUSTOMER")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset;
};


// 5. UPDATE OWN REVIEW
const updateReview = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("ReviewId", sql.BigInt, data.ReviewId)
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("Rating", sql.TinyInt, data.Rating)
        .input("ReviewText", sql.NVarChar(1000), data.ReviewText || null)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


// 6. DELETE OWN REVIEW
const deleteReview = async (reviewId, customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("ReviewId", sql.BigInt, reviewId)
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


// 7. ADMIN - GET ALL REVIEWS
const getAllReviews = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("ProductId", sql.Int, filters.ProductId || null)
        .input("CustomerId", sql.Int, filters.CustomerId || null)
        .input("IsApproved", sql.Bit, filters.IsApproved)
        .execute("dbo.sp_ManageReviews");

    return result.recordset;
};


// 8. ADMIN - APPROVE REVIEW
const approveReview = async (reviewId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "APPROVE")
        .input("ReviewId", sql.BigInt, reviewId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


// 9. ADMIN - HIDE REVIEW
const hideReview = async (reviewId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "HIDE")
        .input("ReviewId", sql.BigInt, reviewId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


// 10. ADMIN - DELETE REVIEW
const adminDeleteReview = async (reviewId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADMIN_DELETE")
        .input("ReviewId", sql.BigInt, reviewId)
        .execute("dbo.sp_ManageReviews");

    return result.recordset[0];
};


module.exports = {
    getCustomerIdByUserId,
    addReview,
    getReviewsByProduct,
    getReviewsByCustomer,
    updateReview,
    deleteReview,
    getAllReviews,
    approveReview,
    hideReview,
    adminDeleteReview
};