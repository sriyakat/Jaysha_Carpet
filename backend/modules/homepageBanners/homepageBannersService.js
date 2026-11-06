
const repository = require("./homepageBannersRepository");

function isVideoUrl(url) {
    return /\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(String(url || ""));
}

function compareBannerOrder(left, right) {
    const orderDifference = Number(left.DisplayOrder ?? left.displayOrder ?? 0)
        - Number(right.DisplayOrder ?? right.displayOrder ?? 0);
    if (orderDifference) return orderDifference;
    return Number(left.BannerId ?? left.bannerId ?? Number.MAX_SAFE_INTEGER)
        - Number(right.BannerId ?? right.bannerId ?? Number.MAX_SAFE_INTEGER);
}

function isFirstBanner(banner, banners) {
    const first = [...banners, banner].sort(compareBannerOrder)[0];
    return Number(first.BannerId ?? first.bannerId) === Number(banner.BannerId ?? banner.bannerId);
}

// ADMIN CHECK
const checkAdmin = (user) => {
    const role = (
        user?.Role ||
        user?.roleName ||
        user?.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Only admin can manage homepage banners.");
    }
};

// VALIDATE BANNER DATA
const validateBannerData = (data) => {
    if (!data.Title || !data.Title.trim()) {
        throw new Error("Banner title is required.");
    }

    if (!data.ImageUrl || !data.ImageUrl.trim()) {
        throw new Error("Banner image or first-banner video is required.");
    }

    const fields = [
        ["Title", 150],
        ["Subtitle", 250],
        ["Description", 1000],
        ["ImageUrl", 500],
        ["MobileImageUrl", 500],
        ["ButtonText", 50],
        ["ButtonUrl", 500],
        ["PromotionCode", 50]
    ];

    for (const [field, maxLength] of fields) {
        const value = data[field];

        if (value !== undefined && value !== null) {
            if (typeof value !== "string") {
                throw new Error(`${field} must be a string.`);
            }

            if (value.length > maxLength) {
                throw new Error(
                    `${field} cannot exceed ${maxLength} characters.`
                );
            }
        }
    }

    const displayOrder = Number(data.DisplayOrder ?? 0);

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
        throw new Error("DisplayOrder must be a non-negative integer.");
    }

    // Validate dates
    const startDate = data.StartDate || null;
    const endDate = data.EndDate || null;

    if (startDate && Number.isNaN(Date.parse(startDate))) {
        throw new Error("Invalid StartDate.");
    }

    if (endDate && Number.isNaN(Date.parse(endDate))) {
        throw new Error("Invalid EndDate.");
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        throw new Error("EndDate cannot be earlier than StartDate.");
    }

    if (
        data.IsActive !== undefined &&
        typeof data.IsActive !== "boolean" &&
        data.IsActive !== 0 &&
        data.IsActive !== 1
    ) {
        throw new Error("IsActive must be true or false.");
    }

    for (const field of ["ImageUrl", "MobileImageUrl"]) {
        const value = data[field];
        if (value && !value.startsWith("/uploads/") && !/^https?:\/\//i.test(value)) {
            throw new Error(`${field} must be an uploaded image.`);
        }
    }

    if (data.MobileImageUrl && isVideoUrl(data.MobileImageUrl)) {
        throw new Error("Mobile banner media must be an image.");
    }
};

// 1. ADD BANNER
const addBanner = async (data, user) => {
    checkAdmin(user);
    validateBannerData(data);
    const banners = await repository.getAllBanners(null);
    const expectedVideo = isFirstBanner({ BannerId: Number.MAX_SAFE_INTEGER, DisplayOrder: data.DisplayOrder }, banners);
    if (isVideoUrl(data.ImageUrl) !== expectedVideo) {
        throw new Error(expectedVideo
            ? "The first homepage banner must use a video."
            : "Only the first homepage banner can use a video.");
    }

    return await repository.addBanner(data);
};

// 2. UPDATE BANNER
const updateBanner = async (bannerId, data, user) => {
    checkAdmin(user);
    validateBannerData(data);

    const existingBanner = await repository.getBannerById(bannerId);

    if (!existingBanner) {
        throw new Error("Banner not found.");
    }

    const oldOrder = Number(existingBanner.DisplayOrder ?? existingBanner.displayOrder ?? 0);
    const nextOrder = Number(data.DisplayOrder ?? 0);
    const oldImage = existingBanner.ImageUrl ?? existingBanner.imageUrl;
    const imageChanged = data.ImageUrl !== oldImage;
    const banners = await repository.getAllBanners(null);
    const expectedVideo = isFirstBanner({ ...existingBanner, DisplayOrder: nextOrder }, banners.filter((banner) => Number(banner.BannerId ?? banner.bannerId) !== bannerId));
    if ((oldOrder !== nextOrder || imageChanged) && isVideoUrl(data.ImageUrl) !== expectedVideo) {
        throw new Error(nextOrder === 0
            ? "The first homepage banner must use a video."
            : "Only the first homepage banner can use a video; other banners must use images.");
    }

    return await repository.updateBanner(bannerId, data);
};

// 3. GET ACTIVE BANNERS - PUBLIC
const getActiveBanners = async () => {
    const banners = await repository.getActiveBanners();
    return banners.sort(compareBannerOrder);
};

// 4. GET ALL BANNERS - ADMIN
const getAllBanners = async (isActive, user) => {
    checkAdmin(user);

    const banners = await repository.getAllBanners(isActive);
    return banners.sort(compareBannerOrder);
};

// 5. GET BANNER BY ID - ADMIN
const getBannerById = async (bannerId, user) => {
    checkAdmin(user);

    const banner = await repository.getBannerById(bannerId);

    if (!banner) {
        throw new Error("Banner not found.");
    }

    return banner;
};

// 6. ACTIVATE BANNER
const activateBanner = async (bannerId, user) => {
    checkAdmin(user);

    return await repository.activateBanner(bannerId);
};

// 7. DEACTIVATE BANNER
const deactivateBanner = async (bannerId, user) => {
    checkAdmin(user);

    return await repository.deactivateBanner(bannerId);
};

// 8. DELETE BANNER
const deleteBanner = async (bannerId, user) => {
    checkAdmin(user);

    return await repository.deleteBanner(bannerId);
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
