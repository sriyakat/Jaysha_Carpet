const variantRepository = require("./productVariantRepository.js");


// ADMIN CHECK
const checkAdmin = (user) => {

    if (!user) {
        throw new Error("Authentication required.");
    }

    const role = (
        user.RoleName ||
        user.Role ||
        user.roleName ||
        user.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Admin access required.");
    }
};


// 1. ADD VARIANT
const addVariant = async (user, data) => {

    checkAdmin(user);

    return await variantRepository.addVariant(data);
};


// 2. UPDATE VARIANT
const updateVariant = async (user, productVariantId, data) => {

    checkAdmin(user);

    return await variantRepository.updateVariant({
        ProductVariantId: productVariantId,
        SizeLabel: data.SizeLabel,
        Price: data.Price,
        DiscountPrice: data.DiscountPrice ?? null,
        StockQuantity: data.StockQuantity,
        IsActive: data.IsActive ?? null
    });
};


// 3. GET VARIANTS BY PRODUCT
const getVariantsByProduct = async (productId) => {

    return await variantRepository.getVariantsByProduct(productId);
};


// 4. GET VARIANT BY ID
const getVariantById = async (productVariantId) => {

    return await variantRepository.getVariantById(productVariantId);
};


// 5. GET ALL VARIANTS
const getAllVariants = async (user, filters) => {

    checkAdmin(user);

    return await variantRepository.getAllVariants(filters);
};


// 6. ACTIVATE VARIANT
const activateVariant = async (user, productVariantId) => {

    checkAdmin(user);

    return await variantRepository.activateVariant(productVariantId);
};


// 7. DEACTIVATE VARIANT
const deactivateVariant = async (user, productVariantId) => {

    checkAdmin(user);

    return await variantRepository.deactivateVariant(productVariantId);
};


module.exports = {
    addVariant,
    updateVariant,
    getVariantsByProduct,
    getVariantById,
    getAllVariants,
    activateVariant,
    deactivateVariant
};