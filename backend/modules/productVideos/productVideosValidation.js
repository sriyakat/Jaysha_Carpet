const validateId = (req, res, next) => {
    const rawId = req.params.productVideoId;
    const id = Number(rawId);

    if (!/^\d+$/.test(String(rawId)) || !Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ID is required."
        });
    }

    next();
};

const validateProductId = (req, res, next) => {
    const id = Number(req.params.productId);
    if (!/^\d+$/.test(String(req.params.productId)) || !Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ProductId is required."
        });
    }

    next();
};

const validateFilters = (req, res, next) => {
    const { productId, isIllustrativePreview } = req.query;
    if (productId !== undefined && (!/^\d+$/.test(String(productId)) || !Number.isSafeInteger(Number(productId)) || Number(productId) <= 0)) {
        return res.status(400).json({
            success: false,
            message: "Valid productId filter is required."
        });
    }
    if (isIllustrativePreview !== undefined && !["true", "false", "0", "1"].includes(String(isIllustrativePreview).toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: "isIllustrativePreview must be true or false."
        });
    }

    next();
};

// ADD validation
const validateAddProductVideo = (req, res, next) => {
    const {
        ProductId,
        StorageKey,
        OriginalFileName,
        FileType,
        FileSize,
        IsIllustrativePreview
    } = req.body;

    if (!Number.isInteger(Number(ProductId)) || Number(ProductId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ProductId is required."
        });
    }

    if (!req.file && (typeof StorageKey !== "string" || !StorageKey.trim() || StorageKey.length > 500)) {
        return res.status(400).json({
            success: false,
            message: "StorageKey is required and must not exceed 500 characters."
        });
    }

    if (!req.file && (typeof OriginalFileName !== "string" || !OriginalFileName.trim() ||
        OriginalFileName.length > 255)) {
        return res.status(400).json({
            success: false,
            message: "Valid OriginalFileName is required."
        });
    }

    if (!req.file && (typeof FileType !== "string" || !FileType.trim() || FileType.length > 50)) {
        return res.status(400).json({
            success: false,
            message: "Valid FileType is required."
        });
    }

    if (!req.file && (!Number.isSafeInteger(Number(FileSize)) || Number(FileSize) <= 0)) {
        return res.status(400).json({
            success: false,
            message: "FileSize must be a positive integer."
        });
    }

    if (
        IsIllustrativePreview !== undefined &&
        typeof IsIllustrativePreview !== "boolean"
        && !["true", "false"].includes(IsIllustrativePreview)
    ) {
        return res.status(400).json({
            success: false,
            message: "IsIllustrativePreview must be true or false."
        });
    }

    next();
};

// UPDATE validation
const validateUpdateProductVideo = (req, res, next) => {
    const {
        StorageKey,
        OriginalFileName,
        FileType,
        FileSize,
        IsIllustrativePreview
    } = req.body;

    if (!req.file && (typeof StorageKey !== "string" || !StorageKey.trim() || StorageKey.length > 500)) {
        return res.status(400).json({
            success: false,
            message: "Valid StorageKey is required."
        });
    }

    if (!req.file && (typeof OriginalFileName !== "string" || !OriginalFileName.trim() ||
        OriginalFileName.length > 255)) {
        return res.status(400).json({
            success: false,
            message: "Valid OriginalFileName is required."
        });
    }

    if (!req.file && (typeof FileType !== "string" || !FileType.trim() || FileType.length > 50)) {
        return res.status(400).json({
            success: false,
            message: "Valid FileType is required."
        });
    }

    if (!req.file && (!Number.isSafeInteger(Number(FileSize)) || Number(FileSize) <= 0)) {
        return res.status(400).json({
            success: false,
            message: "FileSize must be a positive integer."
        });
    }

    if (
        IsIllustrativePreview !== undefined &&
        typeof IsIllustrativePreview !== "boolean"
        && !["true", "false"].includes(IsIllustrativePreview)
    ) {
        return res.status(400).json({
            success: false,
            message: "IsIllustrativePreview must be true or false."
        });
    }

    next();
};

module.exports = {
    validateId,
    validateProductId,
    validateFilters,
    validateAddProductVideo,
    validateUpdateProductVideo
};