
const inventoryService = require("./inventoryService.js");

// COMMON ERROR RESPONSE
const handleError = (res, error) => {
    console.error("Inventory Error:", error);

    // SQL Stored Procedure errors
    let statusCode = error.statusCode || 500;

    if (error.number >= 50001 && error.number <= 50014) {
        statusCode = 400;

        if ([50003, 50006, 50010].includes(error.number)) {
            statusCode = 404;
        }
    }

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error."
    });
};

// 1. STOCK IN
const stockIn = async (req, res) => {
    try {
        const result = await inventoryService.stockIn(
            req.body,
            req.user
        );

        return res.status(201).json({
            success: true,
            message: "Stock added successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 2. STOCK OUT
const stockOut = async (req, res) => {
    try {
        const result = await inventoryService.stockOut(
            req.body,
            req.user
        );

        return res.status(201).json({
            success: true,
            message: "Stock removed successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 3. STOCK ADJUSTMENT
const stockAdjustment = async (req, res) => {
    try {
        const result = await inventoryService.stockAdjustment(
            req.body,
            req.user
        );

        return res.status(201).json({
            success: true,
            message: "Stock adjusted successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 4. GET TRANSACTIONS BY PRODUCT
const getTransactionsByProduct = async (req, res) => {
    try {
        const result =
            await inventoryService.getTransactionsByProduct(
                req.params.productId,
                req.user
            );

        return res.status(200).json({
            success: true,
            message: "Product inventory history fetched successfully.",
            count: result.length,
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 5. GET ALL TRANSACTIONS
const getAllTransactions = async (req, res) => {
    try {
        const result =
            await inventoryService.getAllTransactions(req.user);

        return res.status(200).json({
            success: true,
            message: "Inventory transactions fetched successfully.",
            count: result.length,
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 6. GET TRANSACTION BY ID
const getTransactionById = async (req, res) => {
    try {
        const result =
            await inventoryService.getTransactionById(
                req.params.transactionId,
                req.user
            );

        return res.status(200).json({
            success: true,
            message: "Inventory transaction fetched successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    stockIn,
    stockOut,
    stockAdjustment,
    getTransactionsByProduct,
    getAllTransactions,
    getTransactionById
};
