const { deleteMedia, saveMedia } = require("../../utils/mediaStorage");
const storage = require("./blogPostsStorage");

function handleError(res, error) {
    console.error("Blog post error:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Blog post operation failed.",
    });
}

function mediaKind(file) {
    return file.mimetype.startsWith("video/") ? "video" : "image";
}

async function cleanupUploadedMedia(storageKey) {
    try {
        await deleteMedia(storageKey);
    } catch (error) {
        console.error("Blog media cleanup failed:", error);
    }
}

async function listPublic(req, res) {
    try {
        const page = await storage.list({
            page: req.query.page === undefined ? 1 : req.query.page,
            pageSize: req.query.pageSize === undefined ? 20 : req.query.pageSize
        });
        return res.status(200).json({ success: true, data: page.items, pagination: page.pagination });
    } catch (error) {
        return handleError(res, error);
    }
}

async function listAdmin(req, res) {
    try {
        const page = await storage.list({
            includeInactive: true,
            page: req.query.page === undefined ? 1 : req.query.page,
            pageSize: req.query.pageSize === undefined ? 20 : req.query.pageSize
        });
        return res.status(200).json({ success: true, data: page.items, pagination: page.pagination });
    } catch (error) {
        return handleError(res, error);
    }
}

async function create(req, res) {
    let uploadedMedia;
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "Select an image or video for the blog post." });
        const kind = mediaKind(req.file);
        if (req.body.mediaType !== kind) return res.status(400).json({ success: false, message: "Selected media type does not match the uploaded file." });
        uploadedMedia = await saveMedia(req.file, "blog-posts", kind);
        const post = await storage.create({ ...req.body, mediaUrl: uploadedMedia.StorageKey });
        return res.status(201).json({ success: true, message: "Blog post added.", data: post });
    } catch (error) {
        if (uploadedMedia) await cleanupUploadedMedia(uploadedMedia.StorageKey);
        return handleError(res, error);
    }
}

async function update(req, res) {
    let uploadedMedia;
    let saved = false;
    try {
        if (req.file) {
            const kind = mediaKind(req.file);
            if (req.body.mediaType !== kind) return res.status(400).json({ success: false, message: "Selected media type does not match the uploaded file." });
            uploadedMedia = await saveMedia(req.file, "blog-posts", kind);
        }
        const result = await storage.update(req.params.id, {
            ...req.body,
            ...(uploadedMedia ? { mediaUrl: uploadedMedia.StorageKey } : {}),
        }, Boolean(req.file));
        saved = true;
        if (result.previousMediaUrl) await deleteMedia(result.previousMediaUrl);
        return res.status(200).json({ success: true, message: "Blog post updated.", data: result.post });
    } catch (error) {
        if (uploadedMedia && !saved) await cleanupUploadedMedia(uploadedMedia.StorageKey);
        return handleError(res, error);
    }
}

async function remove(req, res) {
    try {
        const post = await storage.remove(req.params.id);
        await deleteMedia(post.mediaUrl);
        return res.status(200).json({ success: true, message: "Blog post deleted." });
    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = { create, listAdmin, listPublic, remove, update };
