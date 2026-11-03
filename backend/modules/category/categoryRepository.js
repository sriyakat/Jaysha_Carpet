const { sql, poolPromise } = require('../../config/db');

// GET ALL CATEGORIES========================
const getAllCategories = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('IncludeDeleted', sql.Bit, 0)
        .input('OnlyActive', sql.Bit, 1)
        .execute('dbo.sp_Categories_GetAll');

    return result.recordset || [];
};

// GET CATEGORY BY ID ==========================
const getCategoryById = async (categoryId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('CategoryId', sql.Int, categoryId)
        .execute('dbo.sp_Categories_GetById');

    return result.recordset?.[0] || null;
};

// ADD CATEGORY
const createCategory = async (categoryData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('CategoryId', sql.Int, null)
        .input('CategoryName', sql.NVarChar(150), categoryData.categoryName)
        .input('Slug', sql.NVarChar(180), categoryData.slug)
        .input('Description', sql.NVarChar(sql.MAX), categoryData.description || null)
        .input('ImageStorageKey', sql.NVarChar(500), categoryData.imageStorageKey || null)
        .input('DisplayOrder', sql.Int, categoryData.displayOrder ?? 0)
        .execute('dbo.sp_Categories_Save');

    return result.recordset?.[0] || null;
};

// UPDATE CATEGORY
const updateCategory = async (categoryId, categoryData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('CategoryId', sql.Int, categoryId)
        .input('CategoryName', sql.NVarChar(150), categoryData.categoryName)
        .input('Slug', sql.NVarChar(180), categoryData.slug)
        .input('Description', sql.NVarChar(sql.MAX), categoryData.description || null)
        .input('ImageStorageKey', sql.NVarChar(500), categoryData.imageStorageKey || null)
        .input('DisplayOrder', sql.Int, categoryData.displayOrder ?? 0)
        .execute('dbo.sp_Categories_Save');

    return result.recordset?.[0] || null;
};

// DELETE CATEGORY
const deleteCategory = async (categoryId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('CategoryId', sql.Int, categoryId)
        .execute('dbo.sp_Categories_Delete');

    return result.rowsAffected;
};


module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};