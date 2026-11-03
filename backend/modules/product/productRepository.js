
const sql = require("mssql");
const { poolPromise } = require("../../config/db.js");


// 1. GET ALL PRODUCTS
const getAllProducts = async () => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .execute("dbo.sp_ManageProducts");

    return result.recordset;
};


// 2. GET PRODUCT BY ID
const getProductById = async (productId) => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageProducts");

    return {
        product: result.recordsets[0]?.[0] || null,
        images: result.recordsets[1] || []
    };
};


// 3. ADD PRODUCT
const addProduct = async (productData) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "ADD")

        .input("CategoryId", sql.Int, productData.CategoryId)
        .input("ProductName", sql.NVarChar(200), productData.ProductName)
        .input("Slug", sql.NVarChar(220), productData.Slug)
        .input("SKU", sql.NVarChar(60), productData.SKU)

        .input("ShortDescription", sql.NVarChar(500), productData.ShortDescription || null)
        .input("Description", sql.NVarChar(sql.MAX), productData.Description || null)

        .input("Price", sql.Decimal(12, 2), productData.Price)
        .input("DiscountPrice", sql.Decimal(12, 2), productData.DiscountPrice ?? null)

        .input("StockQuantity", sql.Int, productData.StockQuantity ?? 0)

        .input("Material", sql.NVarChar(100), productData.Material || null)
        .input("Size", sql.NVarChar(100), productData.Size || null)
        .input("Shape", sql.NVarChar(50), productData.Shape || null)
        .input("Color", sql.NVarChar(100), productData.Color || null)
        .input("PileHeight", sql.NVarChar(50), productData.PileHeight || null)
        .input("ManufacturingDetails", sql.NVarChar(500), productData.ManufacturingDetails || null)

        .input("IsFeatured", sql.Bit, productData.IsFeatured ?? false)
        .input("IsActive", sql.Bit, productData.IsActive ?? true)

        .execute("dbo.sp_ManageProducts");

    return result.recordset[0];
};


// 4. UPDATE PRODUCT
const updateProduct = async (productId, productData) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("ProductId", sql.Int, productId)

        .input("CategoryId", sql.Int, productData.CategoryId)
        .input("ProductName", sql.NVarChar(200), productData.ProductName)
        .input("Slug", sql.NVarChar(220), productData.Slug)
        .input("SKU", sql.NVarChar(60), productData.SKU)

        .input("ShortDescription", sql.NVarChar(500), productData.ShortDescription || null)
        .input("Description", sql.NVarChar(sql.MAX), productData.Description || null)

        .input("Price", sql.Decimal(12, 2), productData.Price)
        .input("DiscountPrice", sql.Decimal(12, 2), productData.DiscountPrice ?? null)

        .input("StockQuantity", sql.Int, productData.StockQuantity ?? 0)

        .input("Material", sql.NVarChar(100), productData.Material || null)
        .input("Size", sql.NVarChar(100), productData.Size || null)
        .input("Shape", sql.NVarChar(50), productData.Shape || null)
        .input("Color", sql.NVarChar(100), productData.Color || null)
        .input("PileHeight", sql.NVarChar(50), productData.PileHeight || null)
        .input("ManufacturingDetails", sql.NVarChar(500), productData.ManufacturingDetails || null)

        .input("IsFeatured", sql.Bit, productData.IsFeatured ?? false)
        .input("IsActive", sql.Bit, productData.IsActive ?? true)

        .execute("dbo.sp_ManageProducts");

    return result.recordset[0];
};


// 5. DELETE PRODUCT
const deleteProduct = async (productId) => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("ProductId", sql.Int, productId)
        .execute("dbo.sp_ManageProducts");

    return result.recordset[0];
};


// 6. TOGGLE PRODUCT STATUS
const toggleProductStatus = async (productId, isActive) => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "TOGGLE_STATUS")
        .input("ProductId", sql.Int, productId)
        .input("IsActive", sql.Bit, isActive)
        .execute("dbo.sp_ManageProducts");

    return result.recordset[0];
};


// 7. GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (categoryId) => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_CATEGORY")
        .input("CategoryId", sql.Int, categoryId)
        .execute("dbo.sp_ManageProducts");

    return result.recordset;
};


// 8. GET FEATURED PRODUCTS
const getFeaturedProducts = async () => {

    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_FEATURED")
        .execute("dbo.sp_ManageProducts");

    return result.recordset;
};


module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProductsByCategory,
    getFeaturedProducts
};
