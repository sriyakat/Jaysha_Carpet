const express = require("express");
const adminAuth = require("../customer/adminAuthMiddleware");
const { uploadContentImage } = require("../../utils/mediaUpload");
const controller = require("./contentImagesController");
const storage = require("../../utils/contentImageStorage");

const router = express.Router();

router.get("/:resource", adminAuth, (req, res, next) => {
    try {
        storage.validateResource(req.params.resource);
        next();
    } catch (error) {
        res.status(error.statusCode).json({ success: false, message: error.message });
    }
}, controller.getImages);

router.put("/:resource/:id", adminAuth, (req, res, next) => {
    try {
        storage.validateResource(req.params.resource);
        storage.validateId(req.params.resource, req.params.id);
        next();
    } catch (error) {
        res.status(error.statusCode).json({ success: false, message: error.message });
    }
}, uploadContentImage, controller.uploadImage);

router.delete("/:resource/:id", adminAuth, (req, res, next) => {
    try {
        storage.validateResource(req.params.resource);
        storage.validateId(req.params.resource, req.params.id);
        next();
    } catch (error) {
        res.status(error.statusCode).json({ success: false, message: error.message });
    }
}, controller.deleteImage);

module.exports = router;
