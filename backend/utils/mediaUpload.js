const multer = require("multer");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);
const SHOWCASE_TYPES = new Set([...IMAGE_TYPES, ...VIDEO_TYPES]);

function createUploader({ fileSize, allowedTypes, fields }) {
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize, files: fields.reduce((total, field) => total + field.maxCount, 0) },
        fileFilter: (req, file, callback) => {
            if (!allowedTypes.has(file.mimetype)) {
                const error = new Error("Unsupported media file type.");
                error.statusCode = 400;
                callback(error);
                return;
            }
            callback(null, true);
        }
    });

    const parseFiles = fields.length === 1
        ? upload.single(fields[0].name)
        : upload.fields(fields);

    return (req, res, next) => {
        parseFiles(req, res, (error) => {
            if (!error) {
                next();
                return;
            }

            const tooLarge = error.code === "LIMIT_FILE_SIZE";
            return res.status(tooLarge ? 413 : error.statusCode || 400).json({
                success: false,
                message: tooLarge ? "Media file exceeds the upload size limit." : error.message
            });
        });
    };
}

const uploadCategoryImage = createUploader({
    fileSize: 15 * 1024 * 1024,
    allowedTypes: IMAGE_TYPES,
    fields: [{ name: "image", maxCount: 1 }]
});

const uploadHomepageBannerMedia = createUploader({
    fileSize: 100 * 1024 * 1024,
    allowedTypes: SHOWCASE_TYPES,
    fields: [{ name: "desktopImage", maxCount: 1 }, { name: "mobileImage", maxCount: 1 }, { name: "video", maxCount: 1 }]
});

const uploadProductVideo = createUploader({
    fileSize: 100 * 1024 * 1024,
    allowedTypes: VIDEO_TYPES,
    fields: [{ name: "video", maxCount: 1 }]
});

const uploadHomepageShowcaseMedia = createUploader({
    fileSize: 100 * 1024 * 1024,
    allowedTypes: SHOWCASE_TYPES,
    fields: [{ name: "media", maxCount: 1 }]
});

const uploadBlogMedia = createUploader({
    fileSize: 100 * 1024 * 1024,
    allowedTypes: SHOWCASE_TYPES,
    fields: [{ name: "media", maxCount: 1 }]
});

const uploadContentImage = createUploader({
    fileSize: 15 * 1024 * 1024,
    allowedTypes: IMAGE_TYPES,
    fields: [{ name: "image", maxCount: 1 }]
});

const uploadCustomOrderImage = createUploader({
    fileSize: 15 * 1024 * 1024,
    allowedTypes: IMAGE_TYPES,
    fields: [{ name: "referenceImage", maxCount: 1 }]
});

module.exports = { uploadCategoryImage, uploadHomepageBannerMedia, uploadHomepageShowcaseMedia, uploadBlogMedia, uploadProductVideo, uploadContentImage, uploadCustomOrderImage };
