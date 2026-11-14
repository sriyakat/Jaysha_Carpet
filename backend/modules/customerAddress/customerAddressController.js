
const service = require("../customerAddress/customerAddressService.js");

// Common error handler
const handleError = (res, error) => {
    console.error("Customer Address Error:", error);

    const statusCode = error.statusCode || (error.message.includes("not found")
        ? 404
        : error.message.includes("required") ||
          error.message.includes("valid") ||
          error.message.includes("cannot exceed") ||
          error.message.includes("must be") ||
          error.message.includes("supported")
        ? 400
        : 500);

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal server error."
    });
};

// Get logged-in customer's ID
const getCustomerId = (req) => {
    return req.user?.CustomerId;
};


// 1. ADD ADDRESS
const addAddress = async (req, res) => {
    try {
        const customerId = getCustomerId(req);

        const address = await service.addAddress(
            customerId,
            req.body
        );

        return res.status(201).json({
            success: true,
            message: "Address added successfully.",
            data: address
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 2. GET ALL ADDRESSES
const getAllAddresses = async (req, res) => {
    try {
        const customerId = getCustomerId(req);

        const addresses = await service.getAllAddresses(customerId);

        return res.status(200).json({
            success: true,
            message: "Addresses fetched successfully.",
            count: addresses.length,
            data: addresses
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 3. GET ADDRESS BY ID
const getAddressById = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { addressId } = req.params;

        const address = await service.getAddressById(
            customerId,
            addressId
        );

        return res.status(200).json({
            success: true,
            message: "Address fetched successfully.",
            data: address
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 4. UPDATE ADDRESS
const updateAddress = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { addressId } = req.params;

        const address = await service.updateAddress(
            customerId,
            addressId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Address updated successfully.",
            data: address
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 5. DELETE ADDRESS
const deleteAddress = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { addressId } = req.params;

        const result = await service.deleteAddress(
            customerId,
            addressId
        );

        return res.status(200).json({
            success: true,
            message: result.Message || "Address deleted successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// 6. SET DEFAULT ADDRESS
const setDefaultAddress = async (req, res) => {
    try {
        const customerId = getCustomerId(req);
        const { addressId } = req.params;

        const address = await service.setDefaultAddress(
            customerId,
            addressId
        );

        return res.status(200).json({
            success: true,
            message: "Default address updated successfully.",
            data: address
        });
    } catch (error) {
        return handleError(res, error);
    }
};


module.exports = {
    addAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
