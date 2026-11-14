
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

// GET WEBSITE SETTINGS
const getWebsiteSettings = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT TOP 1 *
        FROM dbo.WebsiteSettings
    `);
    return result.recordset[0] || null;
};

// UPDATE WEBSITE SETTINGS
const updateWebsiteSettings = async (data) => {
    const pool = await poolPromise;
    const request = pool.request()
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
        .input("MetaTitle", sql.NVarChar(70), data.MetaTitle)
        .input("MetaDescription", sql.NVarChar(160), data.MetaDescription)
        .input("CanonicalBaseUrl", sql.NVarChar(500), data.CanonicalBaseUrl)
        .input("RobotsIndex", sql.Bit, data.RobotsIndex)
        .input("InrPerUsd", sql.Decimal(12, 6), data.InrPerUsd)
        .input("InternationalShippingRates", sql.NVarChar(sql.MAX), data.InternationalShippingRates)
        .input("ShippingPolicy", sql.NVarChar(sql.MAX), data.ShippingPolicy)
        .input("ReturnPolicy", sql.NVarChar(sql.MAX), data.ReturnPolicy)
        .input("PrivacyPolicy", sql.NVarChar(sql.MAX), data.PrivacyPolicy)
        .input("TermsAndConditions", sql.NVarChar(sql.MAX), data.TermsAndConditions);

    await request.query(`
        UPDATE TOP (1) dbo.WebsiteSettings
        SET ShopName=@ShopName, FooterDescription=@FooterDescription,
            ContactEmail=@ContactEmail, ContactPhone=@ContactPhone,
            WhatsAppNumber=@WhatsAppNumber, BusinessAddress=@BusinessAddress,
            InstagramUrl=@InstagramUrl, FacebookUrl=@FacebookUrl,
            PinterestUrl=@PinterestUrl, YouTubeUrl=@YouTubeUrl,
            CopyrightText=@CopyrightText, MetaTitle=@MetaTitle,
            MetaDescription=@MetaDescription, CanonicalBaseUrl=@CanonicalBaseUrl,
            RobotsIndex=@RobotsIndex, InrPerUsd=@InrPerUsd,
            InternationalShippingRates=@InternationalShippingRates,
            ShippingPolicy=@ShippingPolicy, ReturnPolicy=@ReturnPolicy,
            PrivacyPolicy=@PrivacyPolicy, TermsAndConditions=@TermsAndConditions
    `);

    const result = await pool.request().query(`SELECT TOP 1 * FROM dbo.WebsiteSettings`);
    return result.recordset[0] || null;
};

module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings
};
