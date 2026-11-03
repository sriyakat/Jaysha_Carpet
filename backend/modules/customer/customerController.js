
const customerService = require("../customer/customerService");


// ======================================
// ERROR HANDLER
// ======================================
const handleError = (res, error) => {

    const message = error.message || "Something went wrong.";

    const sqlErrorNumbers = [
        50001, 50002, 50003, 50004, 50005,
        50006, 50007, 50008, 50009, 50010,
        50011, 50012, 50013, 50014, 50015,
        50016, 50017, 50018, 50019
    ];

    if (sqlErrorNumbers.includes(error.number)) {

        const statusCode = error.number === 50005 ? 409 :
            error.number === 50012 || error.number === 50017 ? 404 :
                error.number === 50016 ? 401 : 400;

        return res.status(statusCode).json({
            success: false,
            message
        });
    }

    if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 500) {
        return res.status(error.statusCode).json({
            success: false,
            message
        });
    }

    if ([502, 503].includes(error.statusCode)) {
        console.error("Customer Module Integration Error:", error);

        return res.status(error.statusCode).json({
            success: false,
            message
        });
    }

    console.error("Customer Module Error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
};


// ======================================
// 1. SEND REGISTRATION OTP
// ======================================
const sendRegistrationOtp = async (req, res) => {

    try {
        const result = await customerService.sendRegistrationOtp(req.body);

        return res.status(202).json({
            success: true,
            message: "If registration details are valid, an OTP has been sent.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


const verifyRegistrationOtp = async (req, res) => {
    try {
        const result = await customerService.verifyRegistrationOtp(req.body);

        return res.status(201).json({
            success: true,
            message: "Mobile verified and customer account created successfully.",
            data: result
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 2. LOGIN CUSTOMER
// ======================================
const loginCustomer = async (req, res) => {

    try {

        const result = await customerService.loginCustomer(req.body);

        return res.status(200).json({
            success: true,
            message: "Customer login successful.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};

const sendPasswordResetOtp = async (req, res) => {
    try {
        const result = await customerService.sendPasswordResetOtp(req.body?.MobileNumber);

        return res.status(202).json({
            success: true,
            ...result
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const resetPasswordWithOtp = async (req, res) => {
    try {
        await customerService.resetPasswordWithOtp(req.body);

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now sign in."
        });
    } catch (error) {
        return handleError(res, error);
    }
};


// ======================================
// 3. GET CUSTOMER PROFILE
// ======================================
const getCustomerProfile = async (req, res) => {

    try {

        const UserId = req.user.UserId;

        const result = await customerService.getCustomerProfile(UserId);

        return res.status(200).json({
            success: true,
            message: "Customer profile fetched successfully.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


// ======================================
// 4. UPDATE CUSTOMER PROFILE
// ======================================
const updateCustomerProfile = async (req, res) => {

    try {

        const UserId = req.user.UserId;

        const result = await customerService.updateCustomerProfile(
            UserId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Customer profile updated successfully.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


// ======================================
// 5. CHANGE CUSTOMER PASSWORD
// ======================================
const changeCustomerPassword = async (req, res) => {

    try {

        const UserId = req.user.UserId;

        const result = await customerService.changeCustomerPassword(
            UserId,
            req.body
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


// ======================================
// 6. GET ALL CUSTOMERS (ADMIN)
// ======================================
const getAllCustomers = async (req, res) => {

    try {

        const result = await customerService.getAllCustomers();

        return res.status(200).json({
            success: true,
            message: "Customers fetched successfully.",
            total: result.length,
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


// ======================================
// 7. GET CUSTOMER BY ID (ADMIN)
// ======================================
const getCustomerById = async (req, res) => {

    try {

        const result = await customerService.getCustomerById(
            req.params.customerId
        );

        return res.status(200).json({
            success: true,
            message: "Customer fetched successfully.",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
};


module.exports = {
    sendRegistrationOtp,
    verifyRegistrationOtp,
    loginCustomer,
    sendPasswordResetOtp,
    resetPasswordWithOtp,
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPassword,
    getAllCustomers,
    getCustomerById
};
