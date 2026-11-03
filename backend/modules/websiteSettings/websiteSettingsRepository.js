
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// GET WEBSITE SETTINGS
const getWebsiteSettings = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET")
        .execute("sp_ManageWebsiteSettings");

    return result.recordset[0] || null;
};

// UPDATE WEBSITE SETTINGS
const updateWebsiteSettings = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")

        .input("ShopName", sql.NVarChar(150), data.ShopName)
        .input("FooterDescription", sql.NVarChar(1000), data.FooterDescription)

        .input("ContactEmail", sql.NVarChar(150), data.ContactEmail)
        .input("ContactPhone", sql.NVarChar(30), data.ContactPhone)
        .input("WhatsAppNumber", sql.NVarChar(30), data.WhatsAppNumber)

        .input("BusinessAddress", sql.NVarChar(500), data.BusinessAddress)

        .input("InstagramUrl", sql.NVarChar(500), data.InstagramUrl)
        .input("FacebookUrl", sql.NVarChar(500), data.FacebookUrl)
        .input("PinterestUrl", sql.NVarChar(500), data.PinterestUrl)
        .input("YouTubeUrl", sql.NVarChar(500), data.YouTubeUrl)

        .input("CopyrightText", sql.NVarChar(250), data.CopyrightText)

        .execute("sp_ManageWebsiteSettings");

    return result.recordset[0] || null;
};

module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings
};
