const storage = require("./homepageNewArrivalsStorage");

function handleError(res, error) {
    console.error("Homepage new arrivals error:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.statusCode ? error.message : "Homepage new arrivals operation failed."
    });
}

async function list(req, res) {
    try {
        return res.status(200).json({ success: true, data: await storage.getProductIds() });
    } catch (error) {
        return handleError(res, error);
    }
}

async function replace(req, res) {
    const productIds = req.body?.productIds;
    if (
        !Array.isArray(productIds)
        || productIds.some((id) => !Number.isSafeInteger(id) || id <= 0)
    ) {
        return res.status(400).json({
            success: false,
            message: "Product IDs must be a list of positive whole numbers."
        });
    }

    try {
        return res.status(200).json({
            success: true,
            message: "Homepage new arrivals updated.",
            data: await storage.setProductIds(productIds)
        });
    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = { list, replace };
