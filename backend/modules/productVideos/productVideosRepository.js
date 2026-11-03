const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// ADD
const addProductVideo = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("ProductId", sql.Int, data.ProductId)
        .input("StorageKey", sql.NVarChar(500), data.StorageKey)
        .input("OriginalFileName", sql.NVarChar(255), data.OriginalFileName)
        .input("FileType", sql.NVarChar(50), data.FileType)
        .input("FileSize", sql.BigInt, data.FileSize)
        .input("IsIllustrativePreview", sql.Bit, data.IsIllustrativePreview ?? false)
        .execute("sp_ManageProductVideos");

    return result.recordset[0];
};

// UPDATE
const updateProductVideo = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("ProductVideoId", sql.Int, data.ProductVideoId)
        .input("StorageKey", sql.NVarChar(500), data.StorageKey)
        .input("OriginalFileName", sql.NVarChar(255), data.OriginalFileName)
        .input("FileType", sql.NVarChar(50), data.FileType)
        .input("FileSize", sql.BigInt, data.FileSize)
        .input("IsIllustrativePreview", sql.Bit, data.IsIllustrativePreview ?? null)
        .execute("sp_ManageProductVideos");

    return result.recordset[0];
};

// GET BY PRODUCT
const getProductVideoByProduct = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("sp_ManageProductVideos");

    return result.recordset[0] || null;
};

// GET BY ID
const getProductVideoById = async (productVideoId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("ProductVideoId", sql.Int, productVideoId)
        .execute("sp_ManageProductVideos");

    return result.recordset[0] || null;
};

// GET ALL
const getAllProductVideos = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("ProductId", sql.Int, filters.ProductId ?? null)
        .input("IsIllustrativePreview", sql.Bit, filters.IsIllustrativePreview ?? null)
        .execute("sp_ManageProductVideos");

    return result.recordset;
};

// DELETE
const deleteProductVideo = async (productVideoId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("ProductVideoId", sql.Int, productVideoId)
        .execute("sp_ManageProductVideos");

    return result.recordset[0];
};

module.exports = {
    addProductVideo,
    updateProductVideo,
    getProductVideoByProduct,
    getProductVideoById,
    getAllProductVideos,
    deleteProductVideo
};