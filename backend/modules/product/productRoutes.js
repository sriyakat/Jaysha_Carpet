
const express = require("express");
const router = express.Router();

const productController = require("../product/productController");

// GET ALL PRODUCTS
router.get("/", productController.getAllProducts);

// GET FEATURED PRODUCTS
router.get("/featured", productController.getFeaturedProducts);

// GET PRODUCTS BY CATEGORY
router.get("/category/:categoryId", productController.getProductsByCategory);

// GET PRODUCT BY ID
router.get("/:productId", productController.getProductById);

// ADD PRODUCT
router.post("/", productController.addProduct);

// UPDATE PRODUCT
router.put("/:productId", productController.updateProduct);

// DELETE PRODUCT
router.delete("/:productId", productController.deleteProduct);

// TOGGLE PRODUCT STATUS
router.patch("/:productId/status", productController.toggleProductStatus);

module.exports = router;
