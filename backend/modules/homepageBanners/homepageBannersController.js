
const service = require("./homepageBannersService");
const repository = require("./homepageBannersRepository");
const { saveMedia, deleteMedia } = require("../../utils/mediaStorage");

function formData(req, images) {
    return {
        ...req.body,
        ImageUrl: images.desktop?.StorageKey ?? req.body.ImageUrl,
        MobileImageUrl: images.mobile?.StorageKey ?? req.body.MobileImageUrl ?? null,
        DisplayOrder: Number(req.body.DisplayOrder ?? 0),
        StartDate: req.body.StartDate || null,
        EndDate: req.body.EndDate || null,
        IsActive: req.body.IsActive === undefined
            ? true
            : ["true", "1"].includes(String(req.body.IsActive).toLowerCase())
    };
}

async function saveBannerImages(req) {
    const files = req.files ?? {};
    const images = {};
    try {
        for (const file of [...(files.desktopImage ?? []), ...(files.mobileImage ?? [])]) {
            if (file.size > 15 * 1024 * 1024) {
                const error = new Error("Banner images must be 15 MB or smaller.");
                error.statusCode = 413;
                throw error;
            }
        }
        if (files.video?.length && (files.desktopImage?.length || files.mobileImage?.length)) {
            const error = new Error("Upload a video for the first banner or images for other banners, not both.");
            error.statusCode = 400;
            throw error;
        }
        if (files.video?.[0]) images.desktop = await saveMedia(files.video[0], "banners", "video");
        else if (files.desktopImage?.[0]) images.desktop = await saveMedia(files.desktopImage[0], "banners", "image");
        if (files.mobileImage?.[0]) images.mobile = await saveMedia(files.mobileImage[0], "banners", "image");
        return images;
    } catch (error) {
        await Promise.all(Object.values(images).map((image) => deleteMedia(image.StorageKey)));
        throw error;
    }
}

async function cleanupUploadedImages(images) {
    await Promise.all(Object.values(images).map((image) => deleteMedia(image.StorageKey)));
}

// COMMON ERROR HANDLER
const handleError = (res, error) => {
    console.error("Homepage Banner Error:", error);

    let statusCode = error.statusCode || 500;

    if (!error.statusCode && error.message.includes("Only admin")) {
        statusCode = 403;
    } else if (!error.statusCode && error.message.includes("not found")) {
        statusCode = 404;
    } else if (!error.statusCode && (
        error.message.includes("required") ||
        error.message.includes("Invalid") ||
        error.message.includes("cannot") ||
        error.message.includes("must be") ||
        error.message.includes("must use") ||
        error.message.includes("can use a video") ||
        error.message.includes("earlier")
    )) {
        statusCode = 400;
    } else if (!error.statusCode && (
        error.number >= 50001 &&
        error.number <= 50018
    )) {
        statusCode = 400;
    }

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Something went wrong."
    });
};

// 1. ADD BANNER
const addBanner = async (req, res) => {
    let images = {};
    try {
        images = await saveBannerImages(req);
        const data = await service.addBanner(formData(req, images), req.user);

        return res.status(201).json({
            success: true,
            message: "Homepage banner added successfully.",
            data
        });
    } catch (error) {
        await cleanupUploadedImages(images);
        return handleError(res, error);
    }
};

// 2. UPDATE BANNER
const updateBanner = async (req, res) => {
    let images = {};
    let saved = false;
    try {
        const bannerId = Number(req.params.bannerId);
        const existing = await repository.getBannerById(bannerId);
        if (!existing) throw new Error("Banner not found.");
        images = await saveBannerImages(req);
        const existingImageUrl = existing.ImageUrl ?? existing.imageUrl;
        const existingMobileImageUrl = existing.MobileImageUrl ?? existing.mobileImageUrl;
        const body = formData(req, images);
        if (!images.desktop && !body.ImageUrl) body.ImageUrl = existingImageUrl;
        if (!images.mobile && body.MobileImageUrl === null) body.MobileImageUrl = existingMobileImageUrl;
        const data = await service.updateBanner(
            bannerId,
            body,
            req.user
        );
        saved = true;
        if (images.desktop && existingImageUrl) await deleteMedia(existingImageUrl);
        if (images.mobile && existingMobileImageUrl) await deleteMedia(existingMobileImageUrl);

        return res.status(200).json({
            success: true,
            message: "Homepage banner updated successfully.",
            data
        });
    } catch (error) {
        if (!saved) await cleanupUploadedImages(images);
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
