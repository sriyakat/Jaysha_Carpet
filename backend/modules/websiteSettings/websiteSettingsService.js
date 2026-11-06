
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
    const settings =
        await websiteSettingsRepository.getWebsiteSettings();

    if (!settings) {
        throw new Error("Website settings not found.");
    }

    return {
        ...settings,
        LogoStorageKey: await readAssignment("website-settings", "store")
    };
};

// UPDATE SETTINGS
const updateWebsiteSettings = async (data, user) => {
    checkAdmin(user);

    if (!data.ShopName || !data.ShopName.trim()) {
        throw new Error("Shop name is required.");
    }

    const fields = [
        ["ShopName", 150],
        ["FooterDescription", 1000],
        ["ContactEmail", 150],
        ["ContactPhone", 30],
        ["WhatsAppNumber", 30],
        ["BusinessAddress", 500],
        ["InstagramUrl", 500],
        ["FacebookUrl", 500],
        ["PinterestUrl", 500],
        ["YouTubeUrl", 500],
        ["CopyrightText", 250]
    ];

    // Check maximum field lengths
    for (const [field, maxLength] of fields) {
        const value = data[field];

        if (value !== undefined && value !== null) {
            if (typeof value !== "string") {
                throw new Error(`${field} must be a string.`);
            }

            if (value.length > maxLength) {
                throw new Error(
                    `${field} cannot exceed ${maxLength} characters.`
                );
            }
        }
    }

    // Validate email if provided
    if (data.ContactEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(data.ContactEmail)) {
            throw new Error("Invalid contact email.");
        }
    }

    // Convert empty strings to NULL
    const updateData = {};

    for (const [field] of fields) {
        let value = data[field];

        if (field === "ShopName") {
            updateData[field] = value.trim();
        } else {
            updateData[field] =
                value === undefined || value === null || value.trim() === ""
                    ? null
                    : value.trim();
        }
    }

    const updatedSettings =
        await websiteSettingsRepository.updateWebsiteSettings(updateData);

    return updatedSettings;
};

module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings
};
