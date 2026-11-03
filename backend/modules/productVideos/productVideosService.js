const repository = require("./productVideosRepository.js");

// Admin check
const checkAdmin = (user) => {
    if (!user) {
        throw new Error("Authentication required.");
    }

    const role = user.RoleName || user.Role || user.roleName || user.role;

    if (String(role).toUpperCase() !== "ADMIN") {
        throw new Error("Only admin can manage product videos.");
    }
};

// ADD
const addProductVideo = async (data, user) => {
    checkAdmin(user);

    return await repository.addProductVideo({
        ProductId: Number(data.ProductId),
        StorageKey: data.StorageKey.trim(),
        OriginalFileName: data.OriginalFileName.trim(),
        FileType: data.FileType.trim(),
        FileSize: Number(data.FileSize),
        IsIllustrativePreview: data.IsIllustrativePreview ?? false
    });
};

// UPDATE
const updateProductVideo = async (productVideoId, data, user) => {
    checkAdmin(user);

    return await repository.updateProductVideo({
        ProductVideoId: Number(productVideoId),
        StorageKey: data.StorageKey.trim(),
        OriginalFileName: data.OriginalFileName.trim(),
        FileType: data.FileType.trim(),
        FileSize: Number(data.FileSize),
        IsIllustrativePreview: data.IsIllustrativePreview ?? null
    });
};

// GET BY PRODUCT
const getProductVideoByProduct = async (productId) => {
    return await repository.getProductVideoByProduct(Number(productId));
};

// GET BY ID
const getProductVideoById = async (productVideoId) => {
    return await repository.getProductVideoById(Number(productVideoId));
};

// GET ALL
const getAllProductVideos = async (filters, user) => {
    checkAdmin(user);

    return await repository.getAllProductVideos({
        ProductId: filters.productId ? Number(filters.productId) : null,
        IsIllustrativePreview:
            filters.isIllustrativePreview === undefined
                ? null
                : ["true", "1"].includes(String(filters.isIllustrativePreview).toLowerCase())
    });
};

// DELETE
const deleteProductVideo = async (productVideoId, user) => {
    checkAdmin(user);

    return await repository.deleteProductVideo(Number(productVideoId));
};

module.exports = {
    addProductVideo,
    updateProductVideo,
    getProductVideoByProduct,
    getProductVideoById,
    getAllProductVideos,
    deleteProductVideo
};