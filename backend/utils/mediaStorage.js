const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const mediaRoot = path.resolve(__dirname, "../uploads/media");
const folders = new Set([
    "categories",
    "banners",
    "product-videos",
    "homepage-showcase",
    "homepage-offers",
    "coupon-images",
    "variant-images",
    "website-settings",
    "custom-orders",
    "blog-posts"
]);

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function detectImageType(buffer) {
    if (
        buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) return { extension: ".png", mimeType: "image/png" };

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { extension: ".jpg", mimeType: "image/jpeg" };
    }

    if (buffer.length >= 6) {
        const signature = buffer.toString("ascii", 0, 6);
        if (signature === "GIF87a" || signature === "GIF89a") return { extension: ".gif", mimeType: "image/gif" };
    }

    if (
        buffer.length >= 12
        && buffer.toString("ascii", 0, 4) === "RIFF"
        && buffer.toString("ascii", 8, 12) === "WEBP"
    ) return { extension: ".webp", mimeType: "image/webp" };

    throw badRequest("Uploaded file is not a supported image.");
}

function detectVideoType(buffer) {
    if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
        return { extension: ".mp4", mimeType: "video/mp4" };
    }
    if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
        return { extension: ".webm", mimeType: "video/webm" };
    }
    if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "OggS") {
        return { extension: ".ogg", mimeType: "video/ogg" };
    }

    throw badRequest("Uploaded file is not a supported MP4, WebM, or OGG video.");
}

async function saveMedia(file, folder, kind) {
    if (!folders.has(folder)) throw new Error("Invalid media folder.");
    if (!file?.buffer?.length) throw badRequest(`Select a ${kind} file to upload.`);

    const mediaType = kind === "image" ? detectImageType(file.buffer) : detectVideoType(file.buffer);
    if (file.mimetype !== mediaType.mimeType) {
        throw badRequest(`Uploaded ${kind} file type does not match its contents.`);
    }

    const fileName = `${randomUUID()}${mediaType.extension}`;
    const directory = path.join(mediaRoot, folder);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, fileName), file.buffer, { flag: "wx" });

    return {
        StorageKey: `/uploads/media/${folder}/${fileName}`,
        FileType: mediaType.mimeType,
        FileSize: file.buffer.length
    };
}

async function deleteMedia(storageKey) {
    const match = /^\/uploads\/media\/(categories|banners|product-videos|homepage-showcase|homepage-offers|coupon-images|variant-images|website-settings|custom-orders|blog-posts)\/([0-9a-f-]+\.(?:jpg|png|gif|webp|mp4|webm|ogg))$/i.exec(storageKey || "");
    if (!match) return;

    const directory = path.join(mediaRoot, match[1]);
    const filePath = path.resolve(directory, match[2]);
    if (!filePath.startsWith(`${directory}${path.sep}`)) {
        throw new Error("Media path is outside the upload directory.");
    }

    await fs.rm(filePath, { force: true });
}

module.exports = { saveMedia, deleteMedia };
