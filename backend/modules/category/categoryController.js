const categoryService = require('../category/categoryService.js');
const { saveMedia, deleteMedia } = require('../../utils/mediaStorage');

function categoryData(req, imageStorageKey) {
    return {
        ...req.body,
        categoryName: req.body.categoryName,
        slug: req.body.slug,
        displayOrder: req.body.displayOrder === undefined ? undefined : Number(req.body.displayOrder),
        imageStorageKey
    };
}

function categoryWriteError(res, error) {
    const sqlNumber = error.number ?? error.originalError?.info?.number;
    if (sqlNumber === 2601 || sqlNumber === 2627) {
        return res.status(409).json({
            success: false,
            message: 'इस नाम या URL नाम वाली श्रेणी पहले से मौजूद है। कृपया अलग नाम या URL नाम चुनें।'
        });
    }

    return res.status(error.statusCode === 409 ? 409 : 400).json({
        success: false,
        message: error.message || 'श्रेणी सेव नहीं हो सकी। जानकारी जाँचकर फिर कोशिश करें।'
    });
}

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
    let uploadedMedia;
    let saved = false;
    try {
        if (req.file) uploadedMedia = await saveMedia(req.file, 'categories', 'image');
        const category = await categoryService.createCategory(
            categoryData(req, uploadedMedia?.StorageKey ?? req.body.imageStorageKey)
        );
        saved = true;

        return res.status(201).json({
            success: true,
            message: 'Category created successfully.',
            data: category
        });
    } catch (error) {
        if (uploadedMedia && !saved) await deleteMedia(uploadedMedia.StorageKey);
        return categoryWriteError(res, error);
    }
};

// UPDATE===================================
const updateCategory = async (req, res) => {
    let uploadedMedia;
    let saved = false;
    try {
        const categoryId = Number(req.params.id);
        const existingCategory = await categoryService.getCategoryById(categoryId);
        if (req.file) uploadedMedia = await saveMedia(req.file, 'categories', 'image');

        const category = await categoryService.updateCategory(
            categoryId,
            categoryData(
                req,
                uploadedMedia?.StorageKey
                    ?? req.body.imageStorageKey
                    ?? existingCategory.imageStorageKey
                    ?? existingCategory.ImageStorageKey
            )
        );
        saved = true;
        const previousImage = existingCategory.imageStorageKey ?? existingCategory.ImageStorageKey;
        if (uploadedMedia && previousImage) await deleteMedia(previousImage);

        return res.status(200).json({
            success: true,
            message: 'Category updated successfully.',
            data: category
        });
    } catch (error) {
        if (uploadedMedia && !saved) await deleteMedia(uploadedMedia.StorageKey);
        const statusCode = error.message === 'Category not found.' ? 404 : undefined;

        if (statusCode) return res.status(statusCode).json({ success: false, message: 'श्रेणी नहीं मिली।' });
        return categoryWriteError(res, error);
    }
};

// DELETE======================================
const deleteCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.id);
        const existingCategory = await categoryService.getCategoryById(categoryId);

        await categoryService.deleteCategory(categoryId);
        const image = existingCategory.imageStorageKey ?? existingCategory.ImageStorageKey;
        if (image) await deleteMedia(image);

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