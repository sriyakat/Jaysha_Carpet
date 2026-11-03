
const productRepository = require("../product/productRepository");


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

    return await productRepository.addProduct(productData);
};


// UPDATE PRODUCT
const updateProduct = async (productId, productData) => {

    return await productRepository.updateProduct(productId, productData);
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
