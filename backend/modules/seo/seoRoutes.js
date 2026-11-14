const express = require("express");
const controller = require("./seoController.js");

const router = express.Router();

router.get("/", controller.getRobots);

module.exports = router;
