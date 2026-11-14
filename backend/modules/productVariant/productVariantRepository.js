const sql = require("mssql");
const { poolPromise } = require("../../config/db");

const attachUsdPrices = async (variants) => {
    if (!variants.length) return variants;

    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT ProductVariantId, UsdPrice, UsdDiscountPrice
        FROM dbo.ProductVariants;
    `);
    const pricesById = new Map(result.recordset.map((variant) => [variant.ProductVariantId, variant]));
    return variants.map((variant) => ({
        ...variant,
        ...(pricesById.get(variant.ProductVariantId ?? variant.productVariantId) || {})
    }));
};


// 1. ADD VARIANT
const addVariant = async (data) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await transaction.request()
            .input("Action", sql.NVarChar(30), "ADD")
            .input("ProductId", sql.Int, data.ProductId)
            .input("SizeLabel", sql.NVarChar(100), data.SizeLabel)
            .input("Price", sql.Decimal(12, 2), data.Price)
            .input("DiscountPrice", sql.Decimal(12, 2), data.DiscountPrice ?? null)
            .input("StockQuantity", sql.Int, data.StockQuantity)
            .input("IsActive", sql.Bit, data.IsActive ?? true)
            .execute("dbo.sp_ManageProductVariants");

        const variant = result.recordset[0];
        const productVariantId = Number(variant?.ProductVariantId);
        if (!productVariantId) throw new Error("Variant creation did not return a variant ID.");

        await transaction.request()
            .input("ProductVariantId", sql.Int, productVariantId)
            .input("UsdPrice", sql.Decimal(12, 2), data.UsdPrice)
            .input("UsdDiscountPrice", sql.Decimal(12, 2), data.UsdDiscountPrice ?? null)
            .query(`
                UPDATE dbo.ProductVariants
                SET UsdPrice = @UsdPrice, UsdDiscountPrice = @UsdDiscountPrice
                WHERE ProductVariantId = @ProductVariantId;
            `);

        await transaction.commit();
        return { ...variant, UsdPrice: data.UsdPrice, UsdDiscountPrice: data.UsdDiscountPrice ?? null };
    } catch (error) {
        if (transaction._aborted !== true) await transaction.rollback();
        throw error;
    }
};


// 2. UPDATE VARIANT
const updateVariant = async (data) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await transaction.request()
            .input("Action", sql.NVarChar(30), "UPDATE")
            .input("ProductVariantId", sql.Int, data.ProductVariantId)
            .input("SizeLabel", sql.NVarChar(100), data.SizeLabel)
            .input("Price", sql.Decimal(12, 2), data.Price)
            .input("DiscountPrice", sql.Decimal(12, 2), data.DiscountPrice ?? null)
            .input("StockQuantity", sql.Int, data.StockQuantity)
            .input("IsActive", sql.Bit, data.IsActive ?? null)
            .execute("dbo.sp_ManageProductVariants");

        const variant = result.recordset[0];
        await transaction.request()
            .input("ProductVariantId", sql.Int, data.ProductVariantId)
            .input("UsdPrice", sql.Decimal(12, 2), data.UsdPrice)
            .input("UsdDiscountPrice", sql.Decimal(12, 2), data.UsdDiscountPrice ?? null)
            .query(`
                UPDATE dbo.ProductVariants
                SET UsdPrice = @UsdPrice, UsdDiscountPrice = @UsdDiscountPrice
                WHERE ProductVariantId = @ProductVariantId;
            `);

        await transaction.commit();
        return { ...variant, UsdPrice: data.UsdPrice, UsdDiscountPrice: data.UsdDiscountPrice ?? null };
    } catch (error) {
        if (transaction._aborted !== true) await transaction.rollback();
        throw error;
    }
};


// 3. GET VARIANTS BY PRODUCT
const getVariantsByProduct = async (productId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_PRODUCT")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageProductVariants");

    return attachUsdPrices(result.recordset);
};


// 4. GET VARIANT BY ID
const getVariantById = async (productVariantId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("ProductVariantId", sql.Int, productVariantId)
        .execute("dbo.sp_ManageProductVariants");

    const variants = await attachUsdPrices(result.recordset);
    return variants[0];
};


// 5. GET ALL VARIANTS
const getAllVariants = async (filters) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("ProductId", sql.Int, filters.ProductId ?? null)
        .input("IsActive", sql.Bit, filters.IsActive ?? null)
        .execute("dbo.sp_ManageProductVariants");

    return attachUsdPrices(result.recordset);
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