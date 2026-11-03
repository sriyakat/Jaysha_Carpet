
const inventoryRepository = require("./inventoryRepository.js");

// ADMIN AUTHORIZATION
const checkAdmin = (user) => {
    if (!user) {
        const error = new Error("Authentication required.");
        error.statusCode = 401;
        throw error;
    }

    const role =
        user.RoleName ||
        user.Role ||
        user.roleName ||
        user.role;

    if (String(role || "").toUpperCase() !== "ADMIN") {
        const error = new Error("Admin access required.");
        error.statusCode = 403;
        throw error;
    }
};

// GET LOGGED-IN ADMIN USER ID
const getCreatedBy = (user) => {
    const userId = Number(
        user.UserId || user.userId || user.id
    );

    if (!Number.isSafeInteger(userId) || userId <= 0) {
        const error = new Error("Valid Admin UserId not found in token.");
        error.statusCode = 401;
        throw error;
    }

    return userId;
};

// VALIDATE POSITIVE INTEGER
const validatePositiveInteger = (value, fieldName) => {
    const number = Number(value);

    if (!Number.isSafeInteger(number) || number <= 0) {
        const error = new Error(
            `${fieldName} must be a positive integer.`
        );
        error.statusCode = 400;
        throw error;
    }

    return number;
};

// VALIDATE NON-NEGATIVE INTEGER
const validateNonNegativeInteger = (value, fieldName) => {
    const number = Number(value);

    if (!Number.isSafeInteger(number) || number < 0) {
        const error = new Error(
            `${fieldName} must be zero or a positive integer.`
        );
        error.statusCode = 400;
        throw error;
    }

    return number;
};

// VALIDATE REMARKS
const validateRemarks = (remarks) => {
    if (remarks !== undefined && remarks !== null) {
        if (typeof remarks !== "string" || remarks.length > 500) {
            const error = new Error(
                "Remarks must be a string of maximum 500 characters."
            );
            error.statusCode = 400;
            throw error;
        }
    }

    return remarks || null;
};

// 1. STOCK IN
const stockIn = async (data, user) => {
    checkAdmin(user);

    const inventoryData = {
        ProductId: validatePositiveInteger(data.ProductId, "ProductId"),
        Quantity: validatePositiveInteger(data.Quantity, "Quantity"),
        Remarks: validateRemarks(data.Remarks),
        CreatedBy: getCreatedBy(user)
    };

    return await inventoryRepository.stockIn(inventoryData);
};

// 2. STOCK OUT
const stockOut = async (data, user) => {
    checkAdmin(user);

    const inventoryData = {
        ProductId: validatePositiveInteger(data.ProductId, "ProductId"),
        Quantity: validatePositiveInteger(data.Quantity, "Quantity"),
        OrderId: data.OrderId
            ? validatePositiveInteger(data.OrderId, "OrderId")
            : null,
        Remarks: validateRemarks(data.Remarks),
        CreatedBy: getCreatedBy(user)
    };

    return await inventoryRepository.stockOut(inventoryData);
};

// 3. STOCK ADJUSTMENT
const stockAdjustment = async (data, user) => {
    checkAdmin(user);

    const inventoryData = {
        ProductId: validatePositiveInteger(data.ProductId, "ProductId"),
        Quantity: validateNonNegativeInteger(data.Quantity, "Quantity"),
        Remarks: validateRemarks(data.Remarks),
        CreatedBy: getCreatedBy(user)
    };

    return await inventoryRepository.stockAdjustment(inventoryData);
};

// 4. GET TRANSACTIONS BY PRODUCT
const getTransactionsByProduct = async (productId, user) => {
    checkAdmin(user);

    const id = validatePositiveInteger(productId, "ProductId");

    return await inventoryRepository.getTransactionsByProduct(id);
};

// 5. GET ALL TRANSACTIONS
const getAllTransactions = async (user) => {
    checkAdmin(user);

    return await inventoryRepository.getAllTransactions();
};

// 6. GET TRANSACTION BY ID
const getTransactionById = async (transactionId, user) => {
    checkAdmin(user);

    const id = validatePositiveInteger(
        transactionId,
        "InventoryTransactionId"
    );

    const transaction =
        await inventoryRepository.getTransactionById(id);

    if (!transaction) {
        const error = new Error("Inventory transaction not found.");
        error.statusCode = 404;
        throw error;
    }

    return transaction;
};

module.exports = {
    stockIn,
    stockOut,
    stockAdjustment,
    getTransactionsByProduct,
    getAllTransactions,
    getTransactionById
};
