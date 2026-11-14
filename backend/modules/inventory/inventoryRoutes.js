
const express = require("express");
const router = express.Router();

const inventoryController = require("./inventoryController.js");

const {
    validateProductId,
    validateTransactionId,
    validateStockIn,
    validateStockOut,
    validateAdjustment
} = require("./inventoryValidation.js");

const adminAuth = require("../customer/adminAuthMiddleware.js");

router.post("/low-stock-alerts", adminAuth, inventoryController.sendLowStockAlerts);

// STOCK IN
router.post(
    "/stock-in",
    adminAuth,
    validateStockIn,
    inventoryController.stockIn
);

// STOCK OUT
router.post(
    "/stock-out",
    adminAuth,
    validateStockOut,
    inventoryController.stockOut
);

// STOCK ADJUSTMENT
router.post(
    "/adjustment",
    adminAuth,
    validateAdjustment,
    inventoryController.stockAdjustment
);

// GET ALL TRANSACTIONS
router.get(
    "/",
    adminAuth,
    inventoryController.getAllTransactions
);

// GET TRANSACTIONS BY PRODUCT
router.get(
    "/product/:productId",
    adminAuth,
    validateProductId,
    inventoryController.getTransactionsByProduct
);

// GET TRANSACTION BY ID
router.get(
    "/:transactionId",
    adminAuth,
    validateTransactionId,
    inventoryController.getTransactionById
);

module.exports = router;
