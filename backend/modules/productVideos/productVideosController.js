const service = require("./productVideosService.js");
const repository = require("./productVideosRepository.js");
const path = require("node:path");
const { saveMedia, deleteMedia } = require("../../utils/mediaStorage");

// Common error handler
const handleError = (res, error) => {
    console.error("Product Video Error:", error);

    const sqlErrorMessages = {
        50001: 400,
        50002: 400,
        50003: 400,
        50004: 400,
        50005: 400,
        50006: 404,
        50007: 409,
        50008: 400,
        50009: 404,
        50010: 400,
        50011: 400,
        50012: 400,
        50013: 400,
        50014: 400,
        50015: 400,
        50016: 400,
        50017: 404,
        50018: 400
    };

    const statusCode =
        sqlErrorMessages[error.number] ||
        error.statusCode ||
        (error.message === "Authentication required." ? 401 :
            error.message === "Only admin can manage product videos." ? 403 : 500);

    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error."
    });
};

// ADD
const addProductVideo = async (req, res) => {
    let uploadedMedia;
    try {
        const data = { ...req.body };
        if (req.file) {
            uploadedMedia = await saveMedia(req.file, "product-videos", "video");
            data.StorageKey = uploadedMedia.StorageKey;
            data.OriginalFileName = path.basename(req.file.originalname).slice(0, 255);
            data.FileType = uploadedMedia.FileType;
            data.FileSize = uploadedMedia.FileSize;
        }
        if (typeof data.IsIllustrativePreview === "string") {
            data.IsIllustrativePreview = data.IsIllustrativePreview === "true";
        }
        const result = await service.addProductVideo(data, req.user);

        res.status(201).json({
            success: true,
            message: "Product video added successfully.",
            data: result
        });
    } catch (error) {
        if (uploadedMedia) await deleteMedia(uploadedMedia.StorageKey);
        handleError(res, error);
    }
};

// UPDATE
const updateProductVideo = async (req, res) => {
    let uploadedMedia;
    let saved = false;
    try {
        const productVideoId = Number(req.params.productVideoId);
        const existing = req.file ? await repository.getProductVideoById(productVideoId) : null;
        const data = { ...req.body };
        if (req.file) {
            uploadedMedia = await saveMedia(req.file, "product-videos", "video");
            data.StorageKey = uploadedMedia.StorageKey;
            data.OriginalFileName = path.basename(req.file.originalname).slice(0, 255);
            data.FileType = uploadedMedia.FileType;
            data.FileSize = uploadedMedia.FileSize;
        }
        if (typeof data.IsIllustrativePreview === "string") {
            data.IsIllustrativePreview = data.IsIllustrativePreview === "true";
        }
        const result = await service.updateProductVideo(
            productVideoId,
            data,
            req.user
        );
        saved = true;
        if (uploadedMedia) {
            const oldStorageKey = existing?.StorageKey ?? existing?.storageKey;
            if (oldStorageKey) await deleteMedia(oldStorageKey);
        }

        res.status(200).json({
            success: true,
            message: "Product video updated successfully.",
            data: result
        });
    } catch (error) {
        if (uploadedMedia && !saved) await deleteMedia(uploadedMedia.StorageKey);
        handleError(res, error);
    }
};

// GET BY PRODUCT
const getProductVideoByProduct = async (req, res) => {
    try {
        const result = await service.getProductVideoByProduct(req.params.productId);

        res.status(200).json({
            success: true,
            message: result ? "Product video fetched successfully." : "No video found for this product.",
            data: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

// GET BY ID
const getProductVideoById = async (req, res) => {
    try {
        const result = await service.getProductVideoById(req.params.productVideoId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Product video not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product video fetched successfully.",
            data: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

// GET ALL
const getAllProductVideos = async (req, res) => {
    try {
        const result = await service.getAllProductVideos(req.query, req.user);

        res.status(200).json({
            success: true,
            message: "Product videos fetched successfully.",
            count: result.length,
            data: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

// DELETE
const deleteProductVideo = async (req, res) => {
    try {
        const existing = await repository.getProductVideoById(Number(req.params.productVideoId));
        const result = await service.deleteProductVideo(
            req.params.productVideoId,
            req.user
        );
        const storageKey = existing?.StorageKey ?? existing?.storageKey;
        if (storageKey) await deleteMedia(storageKey);

        res.status(200).json({
            success: true,
            message: result.Message || "Product video deleted successfully.",
            data: result
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    addProductVideo,
    updateProductVideo,
    getProductVideoByProduct,
    getProductVideoById,
    getAllProductVideos,
    deleteProductVideo
};