const categoryRepository = require('../category/categoryRepository.js');

const getAllCategories = async () => {
    return await categoryRepository.getAllCategories();
};

const getCategoryById = async (categoryId) => {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error('Invalid category ID.');
    }

    const category = await categoryRepository.getCategoryById(categoryId);

    if (!category) {
        throw new Error('Category not found.');
    }

    return category;
};

const validateCategoryData = (data) => {
    const { categoryName, slug, displayOrder } = data;

    if (!categoryName || !categoryName.trim()) {
        throw new Error('Category name is required.');
    }

    if (!slug || !slug.trim()) {
        throw new Error('Category slug is required.');
    }

    if (
        displayOrder !== undefined &&
        (!Number.isInteger(displayOrder) || displayOrder < 0)
    ) {
        throw new Error('Display order must be a non-negative integer.');
    }
};

const createCategory = async (categoryData) => {
    validateCategoryData(categoryData);

    return await categoryRepository.createCategory({
        ...categoryData,
        categoryName: categoryData.categoryName.trim(),
        slug: categoryData.slug.trim().toLowerCase()
    });
};

const updateCategory = async (categoryId, categoryData) => {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error('Invalid category ID.');
    }

    // Check category exists before updating
    await getCategoryById(categoryId);

    validateCategoryData(categoryData);

    return await categoryRepository.updateCategory(categoryId, {
        ...categoryData,
        categoryName: categoryData.categoryName.trim(),
        slug: categoryData.slug.trim().toLowerCase()
    });
};

const deleteCategory = async (categoryId) => {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error('Invalid category ID.');
    }

    // Check category exists before deleting
    await getCategoryById(categoryId);

    return await categoryRepository.deleteCategory(categoryId);
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};