const multer = require("multer");

const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            const error = new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
            error.statusCode = 400;
            callback(error);
            return;
        }

        callback(null, true);
    }
});

function uploadProductImage(req, res, next) {
    upload.single("image")(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        const statusCode = error.code === "LIMIT_FILE_SIZE"
            ? 413
            : error.statusCode || 400;

        res.status(statusCode).json({
            success: false,
            message: error.code === "LIMIT_FILE_SIZE"
                ? "Image size must be 5 MB or less."
                : error.message
        });
    });
}

module.exports = uploadProductImage;
