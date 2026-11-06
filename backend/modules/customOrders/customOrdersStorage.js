const { randomUUID } = require("node:crypto");
const repository = require("../sqlContent/contentRepository");

const STATUSES = new Set(["NEW", "CONTACTED", "QUOTED", "ACCEPTED", "COMPLETED", "CANCELLED"]);

function badRequest(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function validateRequest(data, imageUrl) {
    const customerId = Number(data.customerId);
    const customerName = String(data.customerName || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const mobileNumber = String(data.mobileNumber || "").trim();
    const width = Number(data.width);
    const length = Number(data.length);
    const sizeUnit = String(data.sizeUnit || "");
    const colorName = String(data.colorName || "").trim();
    const colorHex = String(data.colorHex || "").trim();
    const notes = String(data.notes || "").trim();

    if (!Number.isSafeInteger(customerId) || customerId <= 0) throw badRequest("A valid customer account is required.");
    if (!customerName || customerName.length > 150) throw badRequest("Enter your name (up to 150 characters).");
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Enter a valid email address.");
    if (!/^[+\d][\d\s()-]{6,19}$/.test(mobileNumber)) throw badRequest("Enter a valid mobile number.");
    if (!Number.isFinite(width) || width < 10 || width > 1000) throw badRequest("Width must be between 10 and 1000.");
    if (!Number.isFinite(length) || length < 10 || length > 1000) throw badRequest("Length must be between 10 and 1000.");
    if (!["cm", "in"].includes(sizeUnit)) throw badRequest("Choose centimetres or inches for the size unit.");
    if (!colorName || colorName.length > 80) throw badRequest("Describe the preferred carpet colour (up to 80 characters).");
    if (!/^#[0-9a-f]{6}$/i.test(colorHex)) throw badRequest("Choose a valid colour.");
    if (notes.length > 1000) throw badRequest("Additional notes must be 1000 characters or fewer.");
    if (!imageUrl) throw badRequest("Attach a carpet reference image.");

    return {
        customerId,
        customerName,
        email,
        mobileNumber,
        width,
        length,
        sizeUnit,
        colorName,
        colorHex,
        notes,
        imageUrl
    };
}

function list({ page = 1, pageSize = 20, search = "", status = "" } = {}) {
    const normalizedSearch = String(search).trim();
    const normalizedStatus = String(status).trim().toUpperCase();
    if (normalizedSearch.length > 150) throw badRequest("Search must be 150 characters or fewer.");
    if (normalizedStatus && !STATUSES.has(normalizedStatus)) throw badRequest("Choose a valid custom order request status.");
    return repository.listCustomOrders({
        page,
        pageSize,
        search: normalizedSearch,
        status: normalizedStatus
    });
}

async function create(data) {
    const values = validateRequest(data, data.imageUrl);
    return repository.createCustomOrder({
        id: randomUUID(),
        ...values
    });
}

async function updateStatus(id, status) {
    if (!STATUSES.has(status)) throw badRequest("Choose a valid custom order request status.");
    const request = await repository.updateCustomOrderStatus(id, status);
    if (!request) {
        const error = new Error("Custom order request not found.");
        error.statusCode = 404;
        throw error;
    }
    return request;
}

module.exports = { create, list, updateStatus };
