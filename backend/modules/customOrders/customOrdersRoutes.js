const express = require("express");
const adminAuth = require("../customer/adminAuthMiddleware");
const customerAuth = require("../customer/customerAuthMiddleware");
const { uploadCustomOrderImage } = require("../../utils/mediaUpload");
const controller = require("./customOrdersController");

const router = express.Router();

router.post("/", customerAuth, uploadCustomOrderImage, controller.create);
router.get("/admin", adminAuth, controller.list);
router.patch("/:id/status", adminAuth, controller.updateStatus);

module.exports = router;
