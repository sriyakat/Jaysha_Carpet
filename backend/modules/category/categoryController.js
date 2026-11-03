const categoryService = require('../category/categoryService.js');

// GET ALL =================================
const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();

        return res.status(200).json({
            success: true,
            message: 'Categories fetched successfully.',
            data: categories
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET BY ID ================================
const getCategoryById = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);

        const category = await categoryService.getCategoryById(categoryId);

        return res.status(200).json({
            success: true,
            message: 'Category fetched successfully.',
            data: category
        });
    } catch (error) {
        const statusCode = error.message === 'Category not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// CREATE ===================================
const createCategory = async (req, res) => {
    try {
        const category = await categoryService.createCategory(req.body);

        return res.status(201).json({
            success: true,
            message: 'Category created successfully.',
            data: category
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE===================================
const updateCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);

        const category = await categoryService.updateCategory(
            categoryId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully.',
            data: category
        });
    } catch (error) {
        const statusCode = error.message === 'Category not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE======================================
const deleteCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);

        await categoryService.deleteCategory(categoryId);

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully.'
        });
    } catch (error) {
        const statusCode = error.message === 'Category not found.' ? 404 : 400;

        return res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};