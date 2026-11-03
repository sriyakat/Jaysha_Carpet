
const validateWebsiteSettings = (req, res, next) => {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({
            success: false,
            message: "Invalid request body."
        });
    }

    if (
        typeof data.ShopName !== "string" ||
        !data.ShopName.trim()
    ) {
        return res.status(400).json({
            success: false,
            message: "Shop name is required."
        });
    }

    next();
};

module.exports = {
    validateWebsiteSettings
};
