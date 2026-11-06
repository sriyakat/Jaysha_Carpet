
const productRepository = require("../product/productRepository");
const { randomUUID } = require("node:crypto");

const validateProductData = (productData) => {
    const fail = (message) => {
        const error = new Error(message);
        error.statusCode = 400;
        throw error;
    };
    const { CategoryId, ProductName, Slug, SKU, Price, DiscountPrice, StockQuantity } = productData;
    const normalizedSlug = typeof Slug === "string" ? Slug.trim() : Slug;
    const normalizedSku = typeof SKU === "string" ? SKU.trim() : SKU;

    if (!Number.isInteger(Number(CategoryId)) || Number(CategoryId) <= 0) fail("उत्पाद की श्रेणी चुनें।");
    if (typeof ProductName !== "string" || !ProductName.trim()) fail("उत्पाद का नाम दर्ज करें।");
    if (ProductName.trim().length > 200) fail("उत्पाद का नाम 200 अक्षरों से अधिक नहीं होना चाहिए।");
    if (normalizedSlug && (typeof normalizedSlug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(normalizedSlug) || normalizedSlug.length > 220)) {
        fail("URL नाम में केवल अंग्रेज़ी अक्षर, अंक और हाइफ़न इस्तेमाल करें (अधिकतम 220 अक्षर)।");
    }
    if (normalizedSku && (typeof normalizedSku !== "string" || normalizedSku.length > 60)) fail("SKU 60 अक्षरों से अधिक नहीं होना चाहिए।");
    if (!Number.isFinite(Number(Price)) || Number(Price) <= 0) fail("उत्पाद की कीमत शून्य से अधिक होनी चाहिए।");
    if (DiscountPrice !== null && DiscountPrice !== undefined && DiscountPrice !== ""
        && (!Number.isFinite(Number(DiscountPrice)) || Number(DiscountPrice) < 0 || Number(DiscountPrice) >= Number(Price))) {
        fail("छूट की कीमत शून्य या उससे अधिक और मूल कीमत से कम होनी चाहिए।");
    }
    if (!Number.isInteger(Number(StockQuantity)) || Number(StockQuantity) < 0) {
        fail("स्टॉक की मात्रा शून्य या उससे बड़ी पूर्ण संख्या होनी चाहिए।");
    }
};

const productDataWithIdentifiers = (productData) => {
    const slug = typeof productData.Slug === "string" ? productData.Slug.trim().toLowerCase() : "";
    const slugBase = String(productData.ProductName || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 200) || "product";

    return {
        ...productData,
        SKU: typeof productData.SKU === "string" && productData.SKU.trim()
            ? productData.SKU.trim()
            : `JC-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`,
        Slug: slug || `${slugBase}-${randomUUID().slice(0, 8)}`
    };
};


// GET ALL PRODUCTS
const getAllProducts = async () => {
    return await productRepository.getAllProducts();
};


// GET PRODUCT BY ID
const getProductById = async (productId) => {

    const product = await productRepository.getProductById(productId);

    if (!product.product) {
        throw new Error("Product not found.");
    }

    return product;
};


// ADD PRODUCT
const addProduct = async (productData) => {

    validateProductData(productData);
    return await productRepository.addProduct(productDataWithIdentifiers(productData));
};


// UPDATE PRODUCT
const updateProduct = async (productId, productData) => {

    validateProductData(productData);
    return await productRepository.updateProduct(productId, productDataWithIdentifiers(productData));
};


// DELETE PRODUCT
const deleteProduct = async (productId) => {

    return await productRepository.deleteProduct(productId);
};


// TOGGLE PRODUCT STATUS
const toggleProductStatus = async (productId, isActive) => {

    return await productRepository.toggleProductStatus(productId, isActive);
};


// GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (categoryId) => {

    return await productRepository.getProductsByCategory(categoryId);
};


// GET FEATURED PRODUCTS
const getFeaturedProducts = async () => {

    return await productRepository.getFeaturedProducts();
};


module.exports = {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProductsByCategory,
    getFeaturedProducts
};
