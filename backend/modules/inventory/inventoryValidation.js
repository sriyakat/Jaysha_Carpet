
const validateProductId = (req, res, next) => {
    const id = Number(req.params.productId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid ProductId."
        });
    }

    next();
};

const validateTransactionId = (req, res, next) => {
    const id = Number(req.params.transactionId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid InventoryTransactionId."
        });
    }

    next();
};

const validateStockIn = (req, res, next) => {
    const { ProductId, Quantity } = req.body;

    if (!Number.isSafeInteger(Number(ProductId)) ||
        Number(ProductId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ProductId is required."
        });
    }

    if (!Number.isSafeInteger(Number(Quantity)) ||
        Number(Quantity) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be greater than zero."
        });
    }

    next();
};

const validateStockOut = (req, res, next) => {
    const { ProductId, Quantity, OrderId } = req.body;

    if (!Number.isSafeInteger(Number(ProductId)) ||
        Number(ProductId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ProductId is required."
        });
    }

    if (!Number.isSafeInteger(Number(Quantity)) ||
        Number(Quantity) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be greater than zero."
        });
    }

    if (OrderId !== undefined && OrderId !== null &&
        (!Number.isSafeInteger(Number(OrderId)) || Number(OrderId) <= 0)) {
        return res.status(400).json({
            success: false,
            message: "Invalid OrderId."
        });
    }

    next();
};

const validateAdjustment = (req, res, next) => {
    const { ProductId, Quantity } = req.body;

    if (!Number.isSafeInteger(Number(ProductId)) ||
        Number(ProductId) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid ProductId is required."
        });
    }

    if (Quantity === undefined || Quantity === null ||
        Quantity === "" ||
        !Number.isSafeInteger(Number(Quantity)) ||
        Number(Quantity) < 0) {
        return res.status(400).json({
            success: false,
            message: "Quantity must be zero or a positive integer."
        });
    }

    next();
};

module.exports = {
    validateProductId,
    validateTransactionId,
    validateStockIn,
    validateStockOut,
    validateAdjustment
};
