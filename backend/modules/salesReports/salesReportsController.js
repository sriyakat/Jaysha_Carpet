const service = require("./salesReportsService");

const handleError = (res, error) => {
    console.error("Sales Report Error:", error);

    if (error.message === "Unauthorized access.") {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }

    if (error.message === "Admin access required.") {
        return res.status(403).json({
            success: false,
            message: error.message
        });
    }

    if (
        error.message.includes("Invalid") ||
        error.message.includes("must") ||
        error.message.includes("greater")
    ) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.number === 50001 || error.number === 50002) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};

// 1. Dashboard Summary
const getSummary = async (req, res) => {
    try {
        const data = await service.getSummary(req.user, {
            fromDate: req.query.fromDate,
            toDate: req.query.toDate
        });

        return res.status(200).json({
            success: true,
            message: "Dashboard summary fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 2. Revenue Trend
const getRevenueTrend = async (req, res) => {
    try {
        const data = await service.getRevenueTrend(req.user, {
            fromDate: req.query.fromDate,
            toDate: req.query.toDate
        });

        return res.status(200).json({
            success: true,
            message: "Revenue report fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 3. Best Selling Products
const getBestSellingProducts = async (req, res) => {
    try {
        const data = await service.getBestSellingProducts(req.user, {
            fromDate: req.query.fromDate,
            toDate: req.query.toDate,
            topCount: req.query.topCount
        });

        return res.status(200).json({
            success: true,
            message: "Best-selling products fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 4. Low Stock Products
const getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold;

        const data = await service.getLowStockProducts(
            req.user,
            threshold
        );

        return res.status(200).json({
            success: true,
            message: "Low-stock products fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 5. Pending Orders
const getPendingOrders = async (req, res) => {
    try {
        const data = await service.getPendingOrders(req.user, {
            fromDate: req.query.fromDate,
            toDate: req.query.toDate
        });

        return res.status(200).json({
            success: true,
            message: "Pending orders fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 6. Recent Orders
const getRecentOrders = async (req, res) => {
    try {
        const data = await service.getRecentOrders(
            req.user,
            req.query.topCount
        );

        return res.status(200).json({
            success: true,
            message: "Recent orders fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 7. Update Settings
const updateSettings = async (req, res) => {
    try {
        const data = await service.updateSettings(
            req.user,
            req.body.lowStockThreshold
        );

        return res.status(200).json({
            success: true,
            message: "Sales report settings updated successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const trackAnalyticsEvent = async (req, res) => {
    try {
        const data = await service.trackAnalyticsEvent(req.body);
        return res.status(201).json({
            success: true,
            message: "Analytics event recorded.",
            data
        });
    } catch (error) {
        return res.status(error.statusCode || 400).json({
            success: false,
            message: error.message
        });
    }
};

const getAnalyticsSummary = async (req, res) => {
    try {
        const data = await service.getAnalyticsSummary(req.user, req.query);
        return res.status(200).json({
            success: true,
            message: "Analytics summary fetched successfully.",
            data
        });
    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    getSummary,
    getRevenueTrend,
    getBestSellingProducts,
    getLowStockProducts,
    getPendingOrders,
    getRecentOrders,
    updateSettings,
    trackAnalyticsEvent,
    getAnalyticsSummary
};