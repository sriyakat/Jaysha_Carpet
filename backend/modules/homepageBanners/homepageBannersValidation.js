
const validateBannerId = (req, res, next) => {
    if (!/^[1-9]\d*$/.test(req.params.bannerId)) {
        return res.status(400).json({
            success: false,
            message: "Valid BannerId is required."
        });
    }

    next();
};

const validateBanner = (req, res, next) => {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({
            success: false,
            message: "Invalid request body."
        });
    }

    if (typeof data.Title !== "string" || !data.Title.trim()) {
        return res.status(400).json({
            success: false,
            message: "Banner title is required."
        });
    }

    if (typeof data.ImageUrl !== "string" || !data.ImageUrl.trim()) {
        return res.status(400).json({
            success: false,
            message: "Banner image URL is required."
        });
    }

    next();
};

module.exports = {
    validateBannerId,
    validateBanner
};
