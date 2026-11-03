
const express = require("express");
const router = express.Router();

const controller = require("./homepageBannersController");

const {
    validateBannerId,
    validateBanner
} = require("./homepageBannersValidation");

const adminAuth = require("../customer/adminAuthMiddleware.js");

// PUBLIC: GET ACTIVE BANNERS
router.get(
    "/active",
    controller.getActiveBanners
);

// ADMIN: ADD BANNER
router.post(
    "/",
    adminAuth,
    validateBanner,
    controller.addBanner
);

// ADMIN: GET ALL BANNERS
router.get(
    "/admin/all",
    adminAuth,
    controller.getAllBanners
);

// ADMIN: GET BANNER BY ID
router.get(
    "/admin/:bannerId",
    adminAuth,
    validateBannerId,
    controller.getBannerById
);

// ADMIN: UPDATE BANNER
router.put(
    "/:bannerId",
    adminAuth,
    validateBannerId,
    validateBanner,
    controller.updateBanner
);

// ADMIN: ACTIVATE
router.patch(
    "/:bannerId/activate",
    adminAuth,
    validateBannerId,
    controller.activateBanner
);

// ADMIN: DEACTIVATE
router.patch(
    "/:bannerId/deactivate",
    adminAuth,
    validateBannerId,
    controller.deactivateBanner
);

// ADMIN: DELETE
router.delete(
    "/:bannerId",
    adminAuth,
    validateBannerId,
    controller.deleteBanner
);

module.exports = router;
