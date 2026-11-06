const { deleteMedia, saveMedia } = require("../../utils/mediaStorage");

function createHomepageMediaController(storage, mediaFolder = "homepage-showcase") {
    function handleError(res, error) {
        console.error("Homepage media error:", error);
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode ? error.message : "Homepage media operation failed."
        });
    }

    function mediaKind(file) {
        return file.mimetype.startsWith("video/") ? "video" : "image";
    }

    async function cleanupUploadedMedia(storageKey) {
        try {
            await deleteMedia(storageKey);
        } catch (error) {
            console.error("Homepage media cleanup failed:", error);
        }
    }

    async function listPublic(req, res) {
        try {
            return res.status(200).json({ success: true, data: await storage.list() });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async function listAdmin(req, res) {
        try {
            return res.status(200).json({ success: true, data: await storage.list({ includeInactive: true }) });
        } catch (error) {
            return handleError(res, error);
        }
    }

    async function create(req, res) {
        let uploadedMedia;
        try {
            if (!req.file) return res.status(400).json({ success: false, message: "Select an image or video to upload." });
            const kind = mediaKind(req.file);
            if (req.body.mediaType !== kind) return res.status(400).json({ success: false, message: "Selected media type does not match the uploaded file." });
            uploadedMedia = await saveMedia(req.file, mediaFolder, kind);
            const item = await storage.create({ ...req.body, mediaUrl: uploadedMedia.StorageKey });
            return res.status(201).json({ success: true, message: "Homepage media item added.", data: item });
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
                uploadedMedia = await saveMedia(req.file, mediaFolder, kind);
            }
            const result = await storage.update(req.params.id, {
                ...req.body,
                ...(uploadedMedia ? { mediaUrl: uploadedMedia.StorageKey } : {})
            }, Boolean(req.file));
            saved = true;
            if (result.previousMediaUrl) await deleteMedia(result.previousMediaUrl);
            return res.status(200).json({ success: true, message: "Homepage media item updated.", data: result.item });
        } catch (error) {
            if (uploadedMedia && !saved) await cleanupUploadedMedia(uploadedMedia.StorageKey);
            return handleError(res, error);
        }
    }

    async function remove(req, res) {
        try {
            const item = await storage.remove(req.params.id);
            await deleteMedia(item.mediaUrl);
            return res.status(200).json({ success: true, message: "Homepage media item deleted." });
        } catch (error) {
            return handleError(res, error);
        }
    }

    return { create, listAdmin, listPublic, remove, update };
}

module.exports = createHomepageMediaController;
