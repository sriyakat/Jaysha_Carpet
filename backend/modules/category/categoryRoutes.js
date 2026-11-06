const express = require('express');
const router = express.Router();

const categoryController = require('./categoryController');
const adminAuth = require('../customer/adminAuthMiddleware');
const { uploadCategoryImage } = require('../../utils/mediaUpload');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.post('/', adminAuth, uploadCategoryImage, categoryController.createCategory);
router.put('/:id', adminAuth, uploadCategoryImage, categoryController.updateCategory);

router.delete('/:id', adminAuth, categoryController.deleteCategory);

module.exports = router;