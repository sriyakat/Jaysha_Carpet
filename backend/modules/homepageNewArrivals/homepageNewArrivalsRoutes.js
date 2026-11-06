const express = require("express");
const adminAuth = require("../customer/adminAuthMiddleware");
const controller = require("./homepageNewArrivalsController");

const router = express.Router();

router.get("/", controller.list);
router.put("/", adminAuth, controller.replace);

module.exports = router;
