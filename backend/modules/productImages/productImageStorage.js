const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const uploadsRoot = path.resolve(__dirname, "../../uploads");
const productUploadsRoot = path.join(uploadsRoot, "products");

function detectImageType(buffer) {
    if (
        buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
        return { extension: ".png", mimeType: "image/png" };
    }

    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { extension: ".jpg", mimeType: "image/jpeg" };
    }

    if (buffer.length >= 6) {
        const signature = buffer.toString("ascii", 0, 6);
        if (signature === "GIF87a" || signature === "GIF89a") {
            return { extension: ".gif", mimeType: "image/gif" };
        }
    }

    if (
        buffer.length >= 12
        && buffer.toString("ascii", 0, 4) === "RIFF"
        && buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return { extension: ".webp", mimeType: "image/webp" };
    }

    const error = new Error("Uploaded file is not a supported image.");
    error.statusCode = 400;
    throw error;
}

async function saveProductImage(productId, file) {
    if (!file?.buffer || file.buffer.length === 0) {
        const error = new Error("Select an image file to upload.");
        error.statusCode = 400;
        throw error;
    }

    const imageType = detectImageType(file.buffer);
    const fileName = `${randomUUID()}${imageType.extension}`;
    const productDirectory = path.join(productUploadsRoot, String(productId));
    const filePath = path.join(productDirectory, fileName);

    await fs.mkdir(productDirectory, { recursive: true });
    await fs.writeFile(filePath, file.buffer, { flag: "wx" });

    return {
        StorageKey: `/uploads/products/${productId}/${fileName}`,
        FileType: imageType.mimeType,
        FileSize: file.buffer.length
    };
}

async function deleteProductImageFile(storageKey) {
    const match = /^\/uploads\/products\/([1-9]\d*)\/([0-9a-f-]+\.(?:jpg|png|gif|webp))$/i.exec(storageKey || "");
    if (!match) return;

    const filePath = path.resolve(productUploadsRoot, match[1], match[2]);
    if (!filePath.startsWith(`${productUploadsRoot}${path.sep}`)) {
        throw new Error("Image path is outside the product upload directory.");
    }

    await fs.rm(filePath, { force: true });
}

module.exports = {
    saveProductImage,
    deleteProductImageFile
};
