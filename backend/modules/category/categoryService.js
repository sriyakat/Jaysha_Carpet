const categoryRepository = require('../category/categoryRepository.js');

const getAllCategories = async () => {
    return await categoryRepository.getAllCategories();
};

const getCategoryById = async (categoryId) => {
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new Error('श्रेणी की जानकारी सही नहीं है।');
    }

    const category = await categoryRepository.getCategoryById(categoryId);

    if (!category) {
        throw new Error('Category not found.');
    }

    return category;
};

const validateCategoryData = (data) => {
    const { categoryName, slug, displayOrder } = data;

    if (typeof categoryName !== 'string' || !categoryName.trim()) {
        throw new Error('श्रेणी का नाम दर्ज करें।');
    }

    if (categoryName.trim().length > 150) {
        throw new Error('श्रेणी का नाम 150 अक्षरों से अधिक नहीं होना चाहिए।');
    }

    if (typeof slug !== 'string' || !slug.trim()) {
        throw new Error('श्रेणी का URL नाम दर्ज करें।');
    }

    if (slug.trim().length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug.trim())) {
        throw new Error('URL नाम में केवल अंग्रेज़ी अक्षर, अंक और हाइफ़न इस्तेमाल करें (अधिकतम 180 अक्षर)।');
    }

    if (
        displayOrder !== undefined &&
        (!Number.isInteger(Number(displayOrder)) || Number(displayOrder) < 0)
    ) {
        throw new Error('क्रमांक शून्य या उससे बड़ी पूर्ण संख्या होनी चाहिए।');
    }

    if (data.imageStorageKey != null && (typeof data.imageStorageKey !== 'string' || data.imageStorageKey.length > 500)) {
        throw new Error('श्रेणी की तस्वीर की जानकारी मान्य नहीं है।');
    }
};

const ensureCategoryIsUnique = async (categoryData, excludedId) => {
    const categories = await categoryRepository.getAllCategories();
    const name = categoryData.categoryName.trim().toLocaleLowerCase();
    const slug = categoryData.slug.trim().toLocaleLowerCase();
    const duplicate = categories.some((category) => {
        const categoryId = category.categoryId ?? category.CategoryId ?? category.id ?? category.Id;
        if (excludedId !== undefined && String(categoryId) === String(excludedId)) return false;
        return (category.categoryName ?? category.CategoryName ?? '').trim().toLocaleLowerCase() === name
            || (category.slug ?? category.Slug ?? '').trim().toLocaleLowerCase() === slug;
    });

    if (duplicate) {
        const error = new Error('इस नाम या URL नाम वाली श्रेणी पहले से मौजूद है। कृपया अलग नाम या URL नाम चुनें।');
        error.statusCode = 409;
        throw error;
    }
};

const createCategory = async (categoryData) => {
    validateCategoryData(categoryData);
    await ensureCategoryIsUnique(categoryData);

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
    await ensureCategoryIsUnique(categoryData, categoryId);

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