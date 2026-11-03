
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// ======================================
// 1. ADD PRODUCT IMAGE
// ======================================
const addProductImage = async (imageData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("ProductId", sql.Int, imageData.ProductId)
        .input("StorageKey", sql.NVarChar(500), imageData.StorageKey)
        .input("OriginalFileName", sql.NVarChar(255), imageData.OriginalFileName || null)
        .input("FileType", sql.NVarChar(50), imageData.FileType || null)
        .input("FileSize", sql.BigInt, imageData.FileSize ?? null)
        .input("IsPrimary", sql.Bit, imageData.IsPrimary ?? false)
        .input("DisplayOrder", sql.Int, imageData.DisplayOrder ?? 0)
        .execute("dbo.sp_ManageProductImages");

    return result.recordset[0];
};


// ======================================
// 2. GET IMAGES BY PRODUCT
// ======================================
const getProductImages = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageProductImages");

    return result.recordset || [];
};


// ======================================
// 3. SET PRIMARY IMAGE
// ======================================
const setPrimaryImage = async (productId, productImageId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "SET_PRIMARY")
        .input("ProductId", sql.Int, productId)
        .input("ProductImageId", sql.Int, productImageId)
        .execute("dbo.sp_ManageProductImages");

    return result.recordset[0];
};


// ======================================
// 4. UPDATE IMAGE DISPLAY ORDER
// ======================================
const updateImageOrder = async (productId, productImageId, displayOrder) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_ORDER")
        .input("ProductId", sql.Int, productId)
        .input("ProductImageId", sql.Int, productImageId)
        .input("DisplayOrder", sql.Int, displayOrder)
        .execute("dbo.sp_ManageProductImages");

    return result.recordset[0];
};


// ======================================
// 5. DELETE PRODUCT IMAGE
// ======================================
const deleteProductImage = async (productId, productImageId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("ProductId", sql.Int, productId)
        .input("ProductImageId", sql.Int, productImageId)
        .execute("dbo.sp_ManageProductImages");

    return result.recordset[0];
};


// ======================================
// EXPORT ALL FUNCTIONS
// ======================================
module.exports = {
    addProductImage,
    getProductImages,
    setPrimaryImage,
    updateImageOrder,
    deleteProductImage
};
