
const service = require("./homepageBannersService");

// COMMON ERROR HANDLER
const handleError = (res, error) => {
    console.error("Homepage Banner Error:", error);

    let statusCode = 500;

    if (error.message.includes("Only admin")) {
        statusCode = 403;
    } else if (error.message.includes("not found")) {
        statusCode = 404;
    } else if (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("cannot") ||
        error.message.includes("must be") ||
        error.message.includes("earlier")
    ) {
        statusCode = 400;
    } else if (
        error.number >= 50001 &&
        error.number <= 50018
    ) {
        statusCode = 400;
    }

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Something went wrong."
    });
};

// 1. ADD BANNER
const addBanner = async (req, res) => {
    try {
        const data = await service.addBanner(req.body, req.user);

        return res.status(201).json({
            success: true,
            message: "Homepage banner added successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 2. UPDATE BANNER
const updateBanner = async (req, res) => {
    try {
        const data = await service.updateBanner(
            Number(req.params.bannerId),
            req.body,
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Homepage banner updated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 3. GET ACTIVE BANNERS
const getActiveBanners = async (req, res) => {
    try {
        const data = await service.getActiveBanners();

        return res.status(200).json({
            success: true,
            message: "Active homepage banners fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 4. GET ALL BANNERS
const getAllBanners = async (req, res) => {
    try {
        let isActive = null;

        if (req.query.isActive !== undefined) {
            if (!["true", "false", "1", "0"].includes(req.query.isActive)) {
                return res.status(400).json({
                    success: false,
                    message: "isActive must be true or false."
                });
            }

            isActive = ["true", "1"].includes(req.query.isActive);
        }

        const data = await service.getAllBanners(isActive, req.user);

        return res.status(200).json({
            success: true,
            message: "All homepage banners fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 5. GET BANNER BY ID
const getBannerById = async (req, res) => {
    try {
        const data = await service.getBannerById(
            Number(req.params.bannerId),
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Homepage banner fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 6. ACTIVATE BANNER
const activateBanner = async (req, res) => {
    try {
        const data = await service.activateBanner(
            Number(req.params.bannerId),
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Banner activated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 7. DEACTIVATE BANNER
const deactivateBanner = async (req, res) => {
    try {
        const data = await service.deactivateBanner(
            Number(req.params.bannerId),
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Banner deactivated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 8. DELETE BANNER
const deleteBanner = async (req, res) => {
    try {
        const data = await service.deleteBanner(
            Number(req.params.bannerId),
            req.user
        );

        return res.status(200).json({
            success: true,
            message: "Banner deleted successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    addBanner,
    updateBanner,
    getActiveBanners,
    getAllBanners,
    getBannerById,
    activateBanner,
    deactivateBanner,
    deleteBanner
};
