
const repository = require("./homepageBannersRepository");

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
        throw new Error("Banner image URL is required.");
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

    // Image URL must be an HTTP/HTTPS URL
    try {
        const imageUrl = new URL(data.ImageUrl);

        if (!["http:", "https:"].includes(imageUrl.protocol)) {
            throw new Error();
        }
    } catch {
        throw new Error("A valid HTTP/HTTPS ImageUrl is required.");
    }

    if (data.MobileImageUrl) {
        try {
            const mobileUrl = new URL(data.MobileImageUrl);

            if (!["http:", "https:"].includes(mobileUrl.protocol)) {
                throw new Error();
            }
        } catch {
            throw new Error("Invalid MobileImageUrl.");
        }
    }
};

// 1. ADD BANNER
const addBanner = async (data, user) => {
    checkAdmin(user);
    validateBannerData(data);

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

    return await repository.updateBanner(bannerId, data);
};

// 3. GET ACTIVE BANNERS - PUBLIC
const getActiveBanners = async () => {
    return await repository.getActiveBanners();
};

// 4. GET ALL BANNERS - ADMIN
const getAllBanners = async (isActive, user) => {
    checkAdmin(user);

    return await repository.getAllBanners(isActive);
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
