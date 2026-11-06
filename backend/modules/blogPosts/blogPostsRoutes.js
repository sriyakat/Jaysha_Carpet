const express = require("express");
const adminAuth = require("../customer/adminAuthMiddleware");
const { uploadBlogMedia } = require("../../utils/mediaUpload");
const controller = require("./blogPostsController");

const router = express.Router();

router.get("/", controller.listPublic);
router.get("/admin", adminAuth, controller.listAdmin);
router.post("/", adminAuth, uploadBlogMedia, controller.create);
router.put("/:id", adminAuth, uploadBlogMedia, controller.update);
router.delete("/:id", adminAuth, controller.remove);

module.exports = router;
