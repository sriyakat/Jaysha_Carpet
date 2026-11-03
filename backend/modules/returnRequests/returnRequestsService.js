
const sql = require("mssql");
const { poolPromise } = require("../../config/db");

const repository = require("./returnRequestsRepository");

// ADMIN CHECK
const checkAdmin = (user) => {
    const role = (
        user?.RoleName ||
        user?.Role ||
        user?.roleName ||
        user?.role ||
        ""
    ).toString().toUpperCase();

    if (role !== "ADMIN") {
        throw new Error("Only admin can perform this action.");
    }
};

// GET CUSTOMER ID FROM TOKEN
const getCustomerId = async (user) => {
    if (user?.CustomerId || user?.customerId) {
        return Number(user.CustomerId || user.customerId);
    }

    const userId = user?.UserId || user?.userId || user?.id;

    if (!userId) {
        throw new Error("Customer authentication required.");
    }

    const pool = await poolPromise;

    const result = await pool.request()
        .input("UserId", sql.Int, userId)
        .query(`
            SELECT CustomerId
            FROM dbo.Customers
            WHERE UserId = @UserId
        `);

    if (!result.recordset.length) {
        throw new Error("Customer profile not found.");
    }

    return result.recordset[0].CustomerId;
};

// 1. CREATE REQUEST
const createRequest = async (data, user) => {
    const customerId = await getCustomerId(user);

    const requestType = (data.RequestType || "").toUpperCase();

    if (!["CANCELLATION", "RETURN"].includes(requestType)) {
        throw new Error("RequestType must be CANCELLATION or RETURN.");
    }

    if (!data.Reason || !data.Reason.trim()) {
        throw new Error("Reason is required.");
    }

    return await repository.createRequest({
        ...data,
        CustomerId: customerId,
        RequestType: requestType
    });
};

// 2. GET MY REQUESTS
const getMyRequests = async (user) => {
    const customerId = await getCustomerId(user);

    return await repository.getByCustomer(customerId);
};

// 3. GET MY REQUEST BY ID
const getMyRequestById = async (requestId, user) => {
    const customerId = await getCustomerId(user);

    const request = await repository.getById(
        requestId,
        customerId
    );

    if (!request) {
        throw new Error("Request not found.");
    }

    return request;
};

// 4. ADMIN GET ALL
const getAllRequests = async (filters, user) => {
    checkAdmin(user);

    return await repository.getAll(filters);
};

// 5. ADMIN UPDATE STATUS
const updateStatus = async (data, user) => {
    checkAdmin(user);

    if (!["APPROVED", "REJECTED"].includes(data.RequestStatus)) {
        throw new Error("Invalid request status.");
    }

    return await repository.updateStatus(data);
};

// 6. ADMIN UPDATE REFUND
const updateRefund = async (data, user) => {
    checkAdmin(user);

    if (!["PENDING", "PROCESSING", "COMPLETED", "FAILED"]
        .includes(data.RefundStatus)) {
        throw new Error("Invalid refund status.");
    }

    if (
        ["PROCESSING", "COMPLETED"].includes(data.RefundStatus) &&
        (!Number(data.RefundAmount) || Number(data.RefundAmount) <= 0)
    ) {
        throw new Error("A positive refund amount is required.");
    }

    return await repository.updateRefund(data);
};

// 7. ADMIN DELETE
const deleteRequest = async (requestId, user) => {
    checkAdmin(user);

    return await repository.deleteRequest(requestId);
};

module.exports = {
    createRequest,
    getMyRequests,
    getMyRequestById,
    getAllRequests,
    updateStatus,
    updateRefund,
    deleteRequest
};
