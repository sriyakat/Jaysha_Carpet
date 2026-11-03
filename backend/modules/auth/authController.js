
const authService = require('../auth/authService.js');

// CREATE FIRST ADMIN
const createAdmin = async (req, res) => {
    try {
        const admin = await authService.createAdmin(req.body);

        return res.status(201).json({
            success: true,
            message: 'Admin created successfully.',
            data: admin
        });

    } catch (error) {
        console.error('Create Admin Error:', error);

        const message = error.originalError?.message ||
            error.message;

        return res.status(400).json({
            success: false,
            message
        });
    }
};


// ADMIN LOGIN ========================================
const loginAdmin = async (req, res) => {
    try {
        const result = await authService.loginAdmin(req.body);

        return res.status(200).json({
            success: true,
            message: 'Admin login successful.',
            data: result
        });

    } catch (error) {
        console.error('Admin Login Error:', error.message);

        const isValidationError = [
            'Email is required.',
            'Password is required.'
        ].includes(error.message);

        return res.status(isValidationError ? 400 : 401).json({
            success: false,
            message: isValidationError
                ? error.message
                : 'Invalid email or password.'
        });
    }
};

module.exports = {
    createAdmin,
    loginAdmin
};
