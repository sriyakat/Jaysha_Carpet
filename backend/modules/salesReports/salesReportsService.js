const repository = require("./salesReportsRepository");

const checkAdmin = (user) => {
    if (!user) {
        throw new Error("Unauthorized access.");
    }

    const role = (
        user.RoleName ||
        user.Role ||
        user.roleName ||
        user.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Admin access required.");
    }
};

const validateDateFilters = (filters = {}) => {
    const { fromDate, toDate } = filters;

    if (fromDate && isNaN(Date.parse(fromDate))) {
        throw new Error("Invalid FromDate.");
    }

    if (toDate && isNaN(Date.parse(toDate))) {
        throw new Error("Invalid ToDate.");
    }

    if (fromDate && toDate &&
        new Date(fromDate) > new Date(toDate)) {
        throw new Error("FromDate cannot be greater than ToDate.");
    }
};

const validateTopCount = (value) => {
    const count = Number(value || 10);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
        throw new Error("TopCount must be between 1 and 100.");
    }

    return count;
};

// 1. Dashboard Summary
const getSummary = async (user, filters) => {
    checkAdmin(user);
    validateDateFilters(filters);

    return await repository.getSummary(filters);
};

// 2. Revenue Trend
const getRevenueTrend = async (user, filters) => {
    checkAdmin(user);
    validateDateFilters(filters);

    return await repository.getRevenueTrend(filters);
};

// 3. Best Selling Products
const getBestSellingProducts = async (user, filters) => {
    checkAdmin(user);
    validateDateFilters(filters);

    filters.topCount = validateTopCount(filters.topCount);

    return await repository.getBestSellingProducts(filters);
};

// 4. Low Stock Products
const getLowStockProducts = async (user, threshold) => {
    checkAdmin(user);

    if (threshold !== undefined && threshold !== null) {
        threshold = Number(threshold);

        if (!Number.isInteger(threshold) || threshold < 0) {
            throw new Error("Threshold must be zero or greater.");
        }
    } else {
        threshold = null;
    }

    return await repository.getLowStockProducts(threshold);
};

// 5. Pending Orders
const getPendingOrders = async (user, filters) => {
    checkAdmin(user);
    validateDateFilters(filters);

    return await repository.getPendingOrders(filters);
};

// 6. Recent Orders
const getRecentOrders = async (user, topCount) => {
    checkAdmin(user);

    topCount = validateTopCount(topCount);

    return await repository.getRecentOrders(topCount);
};

// 7. Update Settings
const updateSettings = async (user, threshold) => {
    checkAdmin(user);

    threshold = Number(threshold);

    if (!Number.isInteger(threshold) || threshold < 0) {
        throw new Error("Low stock threshold must be zero or greater.");
    }

    return await repository.updateSettings(threshold);
};

module.exports = {
    getSummary,
    getRevenueTrend,
    getBestSellingProducts,
    getLowStockProducts,
    getPendingOrders,
    getRecentOrders,
    updateSettings
};