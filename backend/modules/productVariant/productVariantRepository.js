const sql = require("mssql");
const { poolPromise } = require("../../config/db");


// 1. ADD VARIANT
const addVariant = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("ProductId", sql.Int, data.ProductId)
        .input("SizeLabel", sql.NVarChar(100), data.SizeLabel)
        .input("Price", sql.Decimal(12, 2), data.Price)
        .input("DiscountPrice", sql.Decimal(12, 2), data.DiscountPrice ?? null)
        .input("StockQuantity", sql.Int, data.StockQuantity)
        .input("IsActive", sql.Bit, data.IsActive ?? true)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset[0];
};


// 2. UPDATE VARIANT
const updateVariant = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("ProductVariantId", sql.Int, data.ProductVariantId)
        .input("SizeLabel", sql.NVarChar(100), data.SizeLabel)
        .input("Price", sql.Decimal(12, 2), data.Price)
        .input("DiscountPrice", sql.Decimal(12, 2), data.DiscountPrice ?? null)
        .input("StockQuantity", sql.Int, data.StockQuantity)
        .input("IsActive", sql.Bit, data.IsActive ?? null)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset[0];
};


// 3. GET VARIANTS BY PRODUCT
const getVariantsByProduct = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset;
};


// 4. GET VARIANT BY ID
const getVariantById = async (productVariantId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("ProductVariantId", sql.Int, productVariantId)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset[0];
};


// 5. GET ALL VARIANTS
const getAllVariants = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("ProductId", sql.Int, filters.ProductId ?? null)
        .input("IsActive", sql.Bit, filters.IsActive ?? null)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset;
};


// 6. ACTIVATE VARIANT
const activateVariant = async (productVariantId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ACTIVATE")
        .input("ProductVariantId", sql.Int, productVariantId)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset[0];
};


// 7. DEACTIVATE VARIANT
const deactivateVariant = async (productVariantId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DEACTIVATE")
        .input("ProductVariantId", sql.Int, productVariantId)
        .execute("dbo.sp_ManageProductVariants");

    return result.recordset[0];
};


module.exports = {
    addVariant,
    updateVariant,
    getVariantsByProduct,
    getVariantById,
    getAllVariants,
    activateVariant,
    deactivateVariant
};