
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// Common request parameters
const addBannerParameters = (request, data) => {
    request
        .input("Title", sql.NVarChar(150), data.Title ?? null)
        .input("Subtitle", sql.NVarChar(250), data.Subtitle ?? null)
        .input("Description", sql.NVarChar(1000), data.Description ?? null)
        .input("ImageUrl", sql.NVarChar(500), data.ImageUrl ?? null)
        .input("MobileImageUrl", sql.NVarChar(500), data.MobileImageUrl ?? null)
        .input("ButtonText", sql.NVarChar(50), data.ButtonText ?? null)
        .input("ButtonUrl", sql.NVarChar(500), data.ButtonUrl ?? null)
        .input("PromotionCode", sql.NVarChar(50), data.PromotionCode ?? null)
        .input("DisplayOrder", sql.Int, data.DisplayOrder ?? 0)
        .input("StartDate", sql.DateTime2, data.StartDate ?? null)
        .input("EndDate", sql.DateTime2, data.EndDate ?? null)
        .input("IsActive", sql.Bit, data.IsActive ?? true);

    return request;
};

// 1. ADD BANNER
const addBanner = async (data) => {
    const pool = await poolPromise;

    const request = pool.request()
        .input("Action", sql.NVarChar(30), "ADD");

    addBannerParameters(request, data);

    const result = await request.execute("sp_ManageHomepageBanners");

    return result.recordset[0];
};

// 2. UPDATE BANNER
const updateBanner = async (bannerId, data) => {
    const pool = await poolPromise;

    const request = pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("BannerId", sql.Int, bannerId);

    addBannerParameters(request, data);

    const result = await request.execute("sp_ManageHomepageBanners");

    return result.recordset[0];
};

// 3. GET ACTIVE BANNERS
const getActiveBanners = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ACTIVE")
        .execute("sp_ManageHomepageBanners");

    return result.recordset;
};

// 4. GET ALL BANNERS
const getAllBanners = async (isActive = null) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("IsActive", sql.Bit, isActive)
        .execute("sp_ManageHomepageBanners");

    return result.recordset;
};

// 5. GET BANNER BY ID
const getBannerById = async (bannerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("BannerId", sql.Int, bannerId)
        .execute("sp_ManageHomepageBanners");

    return result.recordset[0] || null;
};

// 6. ACTIVATE BANNER
const activateBanner = async (bannerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ACTIVATE")
        .input("BannerId", sql.Int, bannerId)
        .execute("sp_ManageHomepageBanners");

    return result.recordset[0];
};

// 7. DEACTIVATE BANNER
const deactivateBanner = async (bannerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DEACTIVATE")
        .input("BannerId", sql.Int, bannerId)
        .execute("sp_ManageHomepageBanners");

    return result.recordset[0];
};

// 8. DELETE BANNER
const deleteBanner = async (bannerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("BannerId", sql.Int, bannerId)
        .execute("sp_ManageHomepageBanners");

    return result.recordset[0];
};

module.exports = {
    addBanner,
    updateBanner,
    getActiveBanners,
    getAllBanners,
    getBannerById,
    activateBanner,
    deactivateBanner,
    deleteBanner
};
