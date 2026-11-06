const { randomUUID } = require("node:crypto");
const repository = require("../sqlContent/contentRepository");

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createHomepageMediaStorage(sectionKey, { callToAction = false } = {}) {
    function validateData(data, existing, hasMedia) {
        const title = String(data.title || "").trim();
        const eyebrow = String(data.eyebrow || "").trim();
        const caption = String(data.caption || "").trim();
        const buttonText = String(data.buttonText || "").trim();
        const buttonUrl = String(data.buttonUrl || "").trim();
        const displayOrder = Number(data.displayOrder);
        const activeValue = data.isActive;
        const mediaType = data.mediaType;

        if (!title || title.length > 120) throw badRequest("Title is required and must be 120 characters or fewer.");
        if (eyebrow.length > 60) throw badRequest("Eyebrow must be 60 characters or fewer.");
        if (caption.length > 200) throw badRequest("Caption must be 200 characters or fewer.");
        if (callToAction) {
            if (!buttonText || buttonText.length > 50) throw badRequest("Button text is required and must be 50 characters or fewer.");
            if (!buttonUrl || buttonUrl.length > 500) throw badRequest("A valid button URL is required.");
            if (!buttonUrl.startsWith("/") && !buttonUrl.startsWith("#")) {
                let parsedUrl;
                try {
                    parsedUrl = new URL(buttonUrl);
                } catch {
                    throw badRequest("Button URL must be a site path, anchor, or HTTP(S) URL.");
                }
                if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                    throw badRequest("Button URL must use HTTP or HTTPS.");
                }
            }
        }
        if (!Number.isInteger(displayOrder) || displayOrder < 0) throw badRequest("Display order must be a non-negative whole number.");
        if (!["image", "video"].includes(mediaType)) throw badRequest("Choose image or video media.");
        if (![true, false, "true", "false"].includes(activeValue)) throw badRequest("Choose whether the card is visible on the homepage.");
        if (!hasMedia && (!existing || mediaType !== existing.mediaType)) {
            throw badRequest("Upload a new media file when changing the media type.");
        }
        return {
            title,
            eyebrow,
            caption,
            ...(callToAction ? { buttonText, buttonUrl } : {}),
            displayOrder,
            isActive: activeValue === true || activeValue === "true",
            mediaType
        };
    }

    async function list({ includeInactive = false } = {}) {
        return repository.listHomepageMedia(sectionKey, includeInactive);
    }

    async function create(data) {
        const values = validateData(data, null, true);
        return repository.createHomepageMedia(sectionKey, {
            id: randomUUID(),
            ...values,
            mediaUrl: data.mediaUrl
        });
    }

    async function update(id, data, hasMedia) {
        const existing = await repository.getHomepageMediaById(sectionKey, id);
        if (!existing) {
            const error = new Error("Homepage media item not found.");
            error.statusCode = 404;
            throw error;
        }
        const values = validateData(data, existing, hasMedia);
        const item = await repository.updateHomepageMedia(sectionKey, {
            ...existing,
            ...values,
            mediaUrl: hasMedia ? data.mediaUrl : existing.mediaUrl
        });
        return { item, previousMediaUrl: hasMedia ? existing.mediaUrl : null };
    }

    async function remove(id) {
        const item = await repository.deleteHomepageMedia(sectionKey, id);
        if (!item) {
            const error = new Error("Homepage media item not found.");
            error.statusCode = 404;
            throw error;
        }
        return item;
    }

    return { create, list, remove, update };
}

module.exports = createHomepageMediaStorage;
