
const productService = require("../product/productService.js");

const handleProductWriteError = (res, error, next) => {
    const sqlNumber = error.number ?? error.originalError?.info?.number;
    if (sqlNumber === 2601 || sqlNumber === 2627) {
        return res.status(409).json({
            success: false,
            message: "SKU और URL slug पर डेटाबेस का unique नियम अभी चालू है। backend/database/migrations/allow_duplicate_product_skus.sql को SQL Server पर चलाएँ, फिर backend सर्वर restart करें।"
        });
    }

    if (error.statusCode === 400 || error.statusCode === 409) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return next(error);
};


// GET ALL PRODUCTS
const getAllProducts = async (req, res, next) => {

    try {

        const data = await productService.getAllProducts();

        return res.status(200).json({
            success: true,
            message: "Products fetched successfully.",
            data
        });

    } catch (error) {
        next(error);
    }
};


// GET PRODUCT BY ID
const getProductById = async (req, res, next) => {

    try {

        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const data = await productService.getProductById(productId);

        return res.status(200).json({
            success: true,
            message: "Product fetched successfully.",
            data
        });

    } catch (error) {

        if (error.message === "Product not found.") {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};


// ADD PRODUCT
const addProduct = async (req, res, next) => {

    try {

        const result = await productService.addProduct(req.body);

        return res.status(201).json({
            success: true,
            message: result.Message,
            data: {
                ProductId: result.ProductId
            }
        });

    } catch (error) {
        return handleProductWriteError(res, error, next);
    }
};


// UPDATE PRODUCT
const updateProduct = async (req, res, next) => {

    try {

        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const result = await productService.updateProduct(
            productId,
            req.body
        );

        if (!result.Success) {
            return res.status(404).json({
                success: false,
                message: result.Message
            });
        }

        return res.status(200).json({
            success: true,
            message: result.Message
        });

    } catch (error) {
        return handleProductWriteError(res, error, next);
    }
};


// DELETE PRODUCT
const deleteProduct = async (req, res, next) => {

    try {

        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const result = await productService.deleteProduct(productId);

        if (!result.Success) {
            return res.status(404).json({
                success: false,
                message: result.Message
            });
        }

        return res.status(200).json({
            success: true,
            message: result.Message
        });

    } catch (error) {
        next(error);
    }
};


// TOGGLE PRODUCT STATUS
const toggleProductStatus = async (req, res, next) => {

    try {

        const productId = Number(req.params.productId);
        const { IsActive } = req.body;

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        if (typeof IsActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "IsActive must be true or false."
            });
        }

        const result = await productService.toggleProductStatus(
            productId,
            IsActive
        );

        if (!result.Success) {
            return res.status(404).json({
                success: false,
                message: result.Message
            });
        }

        return res.status(200).json({
            success: true,
            message: result.Message
        });

    } catch (error) {
        next(error);
    }
};


// GET PRODUCTS BY CATEGORY
const getProductsByCategory = async (req, res, next) => {

    try {

        const categoryId = Number(req.params.categoryId);

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID."
            });
        }

        const data = await productService.getProductsByCategory(categoryId);

        return res.status(200).json({
            success: true,
            message: "Category products fetched successfully.",
            data
        });

    } catch (error) {
        next(error);
    }
};


// GET FEATURED PRODUCTS
const getFeaturedProducts = async (req, res, next) => {

    try {

        const data = await productService.getFeaturedProducts();

        return res.status(200).json({
            success: true,
            message: "Featured products fetched successfully.",
            data
        });

    } catch (error) {
        next(error);
    }
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
