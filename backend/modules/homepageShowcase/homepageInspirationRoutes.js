const express = require("express");
const adminAuth = require("../customer/adminAuthMiddleware");
const { uploadHomepageShowcaseMedia } = require("../../utils/mediaUpload");
const controller = require("./homepageInspirationController");

const router = express.Router();

router.get("/", controller.listPublic);
router.get("/admin", adminAuth, controller.listAdmin);
router.post("/", adminAuth, uploadHomepageShowcaseMedia, controller.create);
router.put("/:id", adminAuth, uploadHomepageShowcaseMedia, controller.update);
router.delete("/:id", adminAuth, controller.remove);

module.exports = router;
