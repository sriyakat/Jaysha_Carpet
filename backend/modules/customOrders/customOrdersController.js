const { deleteMedia, saveMedia } = require("../../utils/mediaStorage");
const storage = require("./customOrdersStorage");

function handleError(res, error) {
    console.error("Custom order request error:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Custom order request could not be completed."
    });
}

async function create(req, res) {
    let uploadedMedia;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Attach a carpet reference image." });
        }
        uploadedMedia = await saveMedia(req.file, "custom-orders", "image");
        const request = await storage.create({
            ...req.body,
            customerId: req.user.CustomerId,
            imageUrl: uploadedMedia.StorageKey
        });
        return res.status(201).json({
            success: true,
            message: "Your custom carpet request has been sent.",
            data: request
        });
    } catch (error) {
        if (uploadedMedia) {
            try {
                await deleteMedia(uploadedMedia.StorageKey);
            } catch (cleanupError) {
                console.error("Custom order reference image cleanup failed:", cleanupError);
            }
        }
        return handleError(res, error);
    }
}

async function list(req, res) {
    try {
        const page = await storage.list({
            page: req.query.page === undefined ? 1 : req.query.page,
            pageSize: req.query.pageSize === undefined ? 20 : req.query.pageSize,
            search: req.query.search,
            status: req.query.status
        });
        return res.status(200).json({ success: true, data: page.items, pagination: page.pagination });
    } catch (error) {
        return handleError(res, error);
    }
}

async function updateStatus(req, res) {
    try {
        const request = await storage.updateStatus(req.params.id, String(req.body?.status || "").toUpperCase());
        return res.status(200).json({
            success: true,
            message: "Custom order request status updated.",
            data: request
        });
    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = { create, list, updateStatus };
