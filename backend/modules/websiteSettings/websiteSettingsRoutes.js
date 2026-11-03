
const express = require("express");
const router = express.Router();

const websiteSettingsController =
    require("./websiteSettingsController.js");

const {
    validateWebsiteSettings
} = require("./websiteSettingsValidation.js");

const adminAuth =
    require("../customer/adminAuthMiddleware.js");

// PUBLIC: GET WEBSITE SETTINGS
router.get(
    "/",
    websiteSettingsController.getWebsiteSettings
);

// ADMIN: UPDATE WEBSITE SETTINGS
router.put(
    "/",
    adminAuth,
    validateWebsiteSettings,
    websiteSettingsController.updateWebsiteSettings
);

module.exports = router;
