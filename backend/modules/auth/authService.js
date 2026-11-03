
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authRepository = require('../auth/authRepository.js');

// CREATE ADMIN ========================================
const createAdmin = async (adminData) => {

    const { fullName, email, password } = adminData;

    if (!fullName || !fullName.trim()) {
        throw new Error('Full name is required.');
    }

    if (!email || !email.trim()) {
        throw new Error('Email is required.');
    }

    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Hash password before saving
    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await authRepository.createAdmin({
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash
    });

    if (!admin) {
        throw new Error('Admin could not be created.');
    }

    return admin;
};


// ADMIN LOGIN ========================================
const loginAdmin = async (loginData) => {

    const { email, password } = loginData;

    if (!email || !email.trim()) {
        throw new Error('Email is required.');
    }

    if (!password) {
        throw new Error('Password is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find Admin by email
    const admin = await authRepository.getAdminByEmail(normalizedEmail);

    if (!admin) {
        throw new Error('Invalid email or password.');
    }

    // Compare entered password with database hash
    const isPasswordValid = await bcrypt.compare(
        password,
        admin.PasswordHash
    );

    if (!isPasswordValid) {
        throw new Error('Invalid email or password.');
    }

    // Generate JWT
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured.');
    }

    const token = jwt.sign(
        {
            userId: admin.UserId,
            email: admin.Email,
            role: admin.RoleName
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || '8h'
        }
    );

    // Never send password hash to frontend
    return {
        user: {
            userId: admin.UserId,
            fullName: admin.FullName,
            email: admin.Email,
            role: admin.RoleName
        },
        token
    };
};


module.exports = {
    createAdmin,
    loginAdmin
};
