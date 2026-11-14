
const websiteSettingsRepository = require("./websiteSettingsRepository.js");
const { readAssignment } = require("../../utils/contentImageStorage");

// ADMIN CHECK
const checkAdmin = (user) => {
    const role = (
        user?.Role ||
        user?.roleName ||
        user?.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Only admin can update website settings.");
    }
};

// GET SETTINGS
const getWebsiteSettings = async () => {
    const settings = await websiteSettingsRepository.getWebsiteSettings();

    if (!settings) {
        throw new Error("Website settings not found.");
    }

    let shippingRates = {};
    if (settings.InternationalShippingRates) {
        shippingRates = JSON.parse(settings.InternationalShippingRates);
        if (!shippingRates || typeof shippingRates !== "object" || Array.isArray(shippingRates)) {
            throw new Error("Saved international shipping rates are invalid.");
        }
    }

    return {
        ...settings,
        InternationalShippingRates: shippingRates,
        LogoStorageKey: await readAssignment("website-settings", "store")
    };
};

// UPDATE SETTINGS
const updateWebsiteSettings = async (data, user) => {
    checkAdmin(user);

    const fields = [
        "ShopName",
        "FooterDescription",
        "ContactEmail",
        "ContactPhone",
        "WhatsAppNumber",
        "BusinessAddress",
        "InstagramUrl",
        "FacebookUrl",
        "PinterestUrl",
        "YouTubeUrl",
        "CopyrightText",
        "MetaTitle",
        "MetaDescription",
        "CanonicalBaseUrl",
        "ShippingPolicy",
        "ReturnPolicy",
        "PrivacyPolicy",
        "TermsAndConditions"
    ];

    const updateData = {};

    for (const field of fields) {
        const value = data[field];
        if (field === "ShopName") {
            updateData[field] = String(value ?? "").trim();
        } else {
            updateData[field] =
                value === undefined || value === null || String(value).trim() === ""
                    ? null
                    : String(value).trim();
        }
    }
    updateData.RobotsIndex = data.RobotsIndex !== undefined
        ? data.RobotsIndex
        : true;
    updateData.InrPerUsd = data.InrPerUsd === undefined || data.InrPerUsd === null || data.InrPerUsd === ""
        ? null
        : Number(data.InrPerUsd);
    const shippingRates = data.InternationalShippingRates ?? {};
    updateData.InternationalShippingRates = JSON.stringify(shippingRates);

    const updatedSettings =
        await websiteSettingsRepository.updateWebsiteSettings(updateData);

    return {
        ...updatedSettings,
        InternationalShippingRates: shippingRates
    };
};

module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings
};
