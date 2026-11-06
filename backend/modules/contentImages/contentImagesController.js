const storage = require("../../utils/contentImageStorage");

async function getImages(req, res) {
    try {
        const data = await storage.readAssignments(req.params.resource);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return handleError(res, error);
    }
}

async function uploadImage(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Select an image to upload." });
        }
        const storageKey = await storage.uploadContentImage(req.params.resource, req.params.id, req.file);
        return res.status(200).json({ success: true, message: "Image uploaded successfully.", data: { storageKey } });
    } catch (error) {
        return handleError(res, error);
    }
}

async function deleteImage(req, res) {
    try {
        await storage.removeContentImage(req.params.resource, req.params.id);
        return res.status(200).json({ success: true, message: "Image removed successfully." });
    } catch (error) {
        return handleError(res, error);
    }
}

function handleError(res, error) {
    console.error("Content image error:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode === 400 ? error.message : "Image operation failed."
    });
}

module.exports = { deleteImage, getImages, uploadImage };
