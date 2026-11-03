const validateDateQuery = (req, res, next) => {
    const { fromDate, toDate } = req.query;

    if (fromDate && isNaN(Date.parse(fromDate))) {
        return res.status(400).json({
            success: false,
            message: "Invalid fromDate."
        });
    }

    if (toDate && isNaN(Date.parse(toDate))) {
        return res.status(400).json({
            success: false,
            message: "Invalid toDate."
        });
    }

    if (fromDate && toDate &&
        new Date(fromDate) > new Date(toDate)) {
        return res.status(400).json({
            success: false,
            message: "fromDate cannot be greater than toDate."
        });
    }

    next();
};

const validateTopCount = (req, res, next) => {
    const count = Number(req.query.topCount || 10);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
        return res.status(400).json({
            success: false,
            message: "topCount must be between 1 and 100."
        });
    }

    next();
};

const validateThreshold = (req, res, next) => {
    const threshold = Number(req.body.lowStockThreshold);

    if (
        req.body.lowStockThreshold === undefined ||
        !Number.isInteger(threshold) ||
        threshold < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid lowStockThreshold is required."
        });
    }

    next();
};

module.exports = {
    validateDateQuery,
    validateTopCount,
    validateThreshold
};