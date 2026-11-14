
const websiteSettingsService = require("./websiteSettingsService.js");

// GET WEBSITE SETTINGS
const getWebsiteSettings = async (req, res) => {
    try {
        const settings =
            await websiteSettingsService.getWebsiteSettings();

        return res.status(200).json({
            success: true,
            message: "Website settings fetched successfully.",
            data: settings
        });

    } catch (error) {
        console.error("Get Website Settings Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch website settings."
        });
    }
};

// UPDATE WEBSITE SETTINGS
const updateWebsiteSettings = async (req, res) => {
    try {
        const updatedSettings =
            await websiteSettingsService.updateWebsiteSettings(
                req.body,
                req.user
            );

        return res.status(200).json({
            success: true,
            message: "Website settings updated successfully.",
            data: updatedSettings
        });

    } catch (error) {
        console.error("Update Website Settings Error:", error);

        const statusCode =
            error.statusCode ||
            (error.message.includes("Only admin") ? 403 :
            error.message.includes("required") ||
            error.message.includes("Invalid") ||
            error.message.includes("not supported") ||
            error.message.includes("cannot exceed") ||
            error.message.includes("must be") ? 400 : 500);

        return res.status(statusCode).json({
            success: false,
            message: error.message || "Failed to update website settings."
        });
    }
};

module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings
};
