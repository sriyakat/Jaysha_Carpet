const { randomUUID } = require("node:crypto");
const repository = require("../sqlContent/contentRepository");

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function validateData(data, existing, hasMedia) {
    const title = String(data.title || "").trim();
    const category = String(data.category || "").trim();
    const excerpt = String(data.excerpt || "").trim();
    const body = String(data.body || "").trim();
    const imageAlt = String(data.imageAlt || "").trim();
    const displayOrder = Number(data.displayOrder);
    const activeValue = data.isActive;
    const mediaType = data.mediaType;

    if (!title || title.length > 120) throw badRequest("Title is required and must be 120 characters or fewer.");
    if (!category || category.length > 60) throw badRequest("Category is required and must be 60 characters or fewer.");
    if (!excerpt || excerpt.length > 250) throw badRequest("Excerpt is required and must be 250 characters or fewer.");
    if (!body || body.length > 100000) throw badRequest("Article text is required and must be 100,000 characters or fewer.");
    if (imageAlt.length > 200) throw badRequest("Image description must be 200 characters or fewer.");
    if (!Number.isInteger(displayOrder) || displayOrder < 0) throw badRequest("Display order must be a non-negative whole number.");
    if (!["image", "video"].includes(mediaType)) throw badRequest("Choose image or video media.");
    if (![true, false, "true", "false"].includes(activeValue)) throw badRequest("Choose whether the article is published.");
    if (!hasMedia && (!existing || mediaType !== existing.mediaType)) {
        throw badRequest("Upload a new media file when changing the media type.");
    }

    const words = body.split(/\s+/).filter(Boolean).length;
    return {
        title,
        category,
        excerpt,
        body,
        imageAlt,
        displayOrder,
        isActive: activeValue === true || activeValue === "true",
        mediaType,
        readTime: `${Math.max(1, Math.ceil(words / 200))} min read`,
    };
}

function list({ includeInactive = false, page = 1, pageSize = 20 } = {}) {
    return repository.listBlogPosts({ includeInactive, page, pageSize });
}

async function create(data) {
    const values = validateData(data, null, true);
    return repository.createBlogPost({ id: randomUUID(), ...values, mediaUrl: data.mediaUrl });
}

async function update(id, data, hasMedia) {
    const existing = await repository.getBlogPostById(id);
    if (!existing) {
        const error = new Error("Blog post not found.");
        error.statusCode = 404;
        throw error;
    }
    const values = validateData(data, existing, hasMedia);
    const post = await repository.updateBlogPost({
        ...existing,
        ...values,
        mediaUrl: hasMedia ? data.mediaUrl : existing.mediaUrl,
    });
    return { post, previousMediaUrl: hasMedia ? existing.mediaUrl : null };
}

async function remove(id) {
    const post = await repository.deleteBlogPost(id);
    if (!post) {
        const error = new Error("Blog post not found.");
        error.statusCode = 404;
        throw error;
    }
    return post;
}

module.exports = { create, list, remove, update };
