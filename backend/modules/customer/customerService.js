
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const customerRepository = require("../customer/customerRepository.js");
const msg91OtpService = require("./msg91OtpService.js");


// ======================================
// JWT SECRET
// ======================================
const JWT_SECRET =
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET is missing in environment.");
}

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isValidPassword = (password) => (
    typeof password === "string"
    && password.length >= 8
    && Buffer.byteLength(password, "utf8") <= 72
);

const normalizeMobileNumber = (mobileNumber) => {
    if (!isNonEmptyString(mobileNumber)) {
        throw createError("A valid Indian mobile number is required.");
    }

    const digits = mobileNumber.trim().replace(/\D/g, "");
    const localNumber = digits.length === 12 && digits.startsWith("91")
        ? digits.slice(2)
        : digits;

    if (!/^[6-9]\d{9}$/.test(localNumber)) {
        throw createError("Enter a valid 10-digit Indian mobile number.");
    }

    return localNumber;
};

const validateRegistrationData = (customerData) => {
    if (!customerData || typeof customerData !== "object") {
        throw createError("Customer details are required.");
    }

    const { FullName, MobileNumber, Email, Password } = customerData;

    if (
        !isNonEmptyString(FullName)
        || !isNonEmptyString(MobileNumber)
        || !isNonEmptyString(Email)
        || typeof Password !== "string"
        || Password.length === 0
    ) {
        throw createError("All fields are required.");
    }

    if (FullName.trim().length > 150) {
        throw createError("Full name cannot exceed 150 characters.");
    }

    const normalizedMobileNumber = normalizeMobileNumber(MobileNumber);
    const normalizedEmail = Email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedEmail.length > 150 || !emailRegex.test(normalizedEmail)) {
        throw createError("Please enter a valid email address.");
    }

    if (!isValidPassword(Password)) {
        throw createError("Password must be 8 or more characters and no more than 72 bytes.");
    }

    return {
        FullName: FullName.trim(),
        MobileNumber: normalizedMobileNumber,
        Email: normalizedEmail,
        Password
    };
};

const createCustomerSession = (customer) => {
    const token = jwt.sign(
        {
            UserId: customer.UserId,
            CustomerId: customer.CustomerId,
            Email: customer.Email,
            RoleName: "CUSTOMER"
        },
        JWT_SECRET,
        { expiresIn: "8h" }
    );

    return {
        customer,
        token
    };
};


// ======================================
// 1. SEND REGISTRATION OTP
// ======================================
const sendRegistrationOtp = async (customerData) => {
    const customer = validateRegistrationData(customerData);
    const conflict = await customerRepository.findCustomerConflict({
        Email: customer.Email,
        MobileNumber: customer.MobileNumber
    });

    if (conflict?.ConflictField === "Email") {
        throw createError("This email is already registered.", 409);
    }
    if (conflict) {
        throw createError("This mobile number is already registered.", 409);
    }

    await msg91OtpService.sendOtp(customer.MobileNumber);
    return { MobileNumber: customer.MobileNumber };
};

const verifyRegistrationOtp = async (registrationData) => {
    const customer = validateRegistrationData(registrationData);
    const otp = registrationData.Otp;

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
        throw createError("Enter the 6-digit OTP sent to your mobile.");
    }

    await msg91OtpService.verifyOtp(customer.MobileNumber, otp);

    const conflict = await customerRepository.findCustomerConflict({
        Email: customer.Email,
        MobileNumber: customer.MobileNumber
    });
    if (conflict?.ConflictField === "Email") {
        throw createError("This email is already registered.", 409);
    }
    if (conflict) {
        throw createError("This mobile number is already registered.", 409);
    }

    const PasswordHash = await bcrypt.hash(customer.Password, 12);
    const result = await customerRepository.registerCustomer({
        FullName: customer.FullName,
        MobileNumber: customer.MobileNumber,
        Email: customer.Email,
        PasswordHash
    });

    if (!result?.UserId || !result?.CustomerId) {
        throw createError("Customer account could not be created.", 500);
    }

    return createCustomerSession(result);
};


// ======================================
// 2. LOGIN CUSTOMER
// ======================================
const loginCustomer = async (loginData) => {

    if (!loginData || typeof loginData !== "object") {
        throw createError("Email and password are required.");
    }

    const { Email, Password } = loginData;

    if (!isNonEmptyString(Email) || typeof Password !== "string" || !Password) {
        throw createError("Email and password are required.");
    }

    const normalizedEmail = Email.trim().toLowerCase();
    if (normalizedEmail.length > 150) {
        throw createError("Please enter a valid email address.");
    }

    const customer = await customerRepository.loginCustomer(
        normalizedEmail
    );

    if (!customer) {
        throw createError("Invalid email or password.", 401);
    }

    if (!customer.IsActive) {
        throw createError("Your account is inactive.", 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
        Password,
        customer.PasswordHash
    );

    if (!isPasswordValid) {
        throw createError("Invalid email or password.", 401);
    }

    // Remove password hash before response
    const {
        PasswordHash,
        IsActive,
        ...customerInfo
    } = customer;

    // Generate JWT
    return createCustomerSession(customerInfo);
};

const sendPasswordResetOtp = async (mobileNumber) => {
    const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
    const customer = await customerRepository.getCustomerByMobile(normalizedMobileNumber);

    if (customer?.IsActive) {
        await msg91OtpService.sendOtp(normalizedMobileNumber);
    }

    return {
        message: "If an active account uses this number, an OTP has been sent."
    };
};

const resetPasswordWithOtp = async (resetData) => {
    if (!resetData || typeof resetData !== "object") {
        throw createError("Mobile number, OTP, and new password are required.");
    }

    const MobileNumber = normalizeMobileNumber(resetData.MobileNumber);
    const { Otp, NewPassword } = resetData;

    if (typeof Otp !== "string" || !/^\d{6}$/.test(Otp)) {
        throw createError("Enter the 6-digit OTP sent to your mobile.");
    }
    if (!isValidPassword(NewPassword)) {
        throw createError("Password must be 8 or more characters and no more than 72 bytes.");
    }

    await msg91OtpService.verifyOtp(MobileNumber, Otp);
    const customer = await customerRepository.getCustomerByMobile(MobileNumber);
    if (!customer || !customer.IsActive) {
        throw createError("Invalid OTP or customer account.", 401);
    }

    const PasswordHash = await bcrypt.hash(NewPassword, 12);
    return customerRepository.resetCustomerPasswordByMobile(MobileNumber, PasswordHash);
};


// ======================================
// 3. GET CUSTOMER PROFILE
// ======================================
const getCustomerProfile = async (UserId) => {

    const customer = await customerRepository.getCustomerProfile(UserId);

    if (!customer) {
        throw new Error("Customer profile not found.");
    }

    return customer;
};


// ======================================
// 4. UPDATE CUSTOMER PROFILE
// ======================================
const updateCustomerProfile = async (UserId, customerData) => {

    if (!customerData || typeof customerData !== "object") {
        throw createError("Full name and mobile number are required.");
    }

    const { FullName, MobileNumber } = customerData;

    if (!isNonEmptyString(FullName) || !isNonEmptyString(MobileNumber)) {
        throw createError("Full name and mobile number are required.");
    }

    if (FullName.trim().length > 150) {
        throw createError("Full name cannot exceed 150 characters.");
    }

    if (MobileNumber.trim().length > 20) {
        throw createError("Mobile number cannot exceed 20 characters.");
    }

    const result = await customerRepository.updateCustomerProfile(
        UserId,
        {
            FullName: FullName.trim(),
            MobileNumber: MobileNumber.trim()
        }
    );

    if (!result) {
        throw createError("Customer profile not found.", 404);
    }

    return result;
};


// ======================================
// 5. CHANGE CUSTOMER PASSWORD
// ======================================
const changeCustomerPassword = async (UserId, passwordData) => {

    if (!passwordData || typeof passwordData !== "object") {
        throw createError("Old and new passwords are required.");
    }

    const { OldPassword, NewPassword } = passwordData;

    if (typeof OldPassword !== "string" || !OldPassword || typeof NewPassword !== "string" || !NewPassword) {
        throw createError("Old and new passwords are required.");
    }

    if (NewPassword.length < 8) {
        throw createError("New password must be at least 8 characters.");
    }

    if (Buffer.byteLength(NewPassword, "utf8") > 72) {
        throw createError("New password cannot exceed 72 bytes.");
    }

    if (OldPassword === NewPassword) {
        throw createError("New password must be different from old password.");
    }

    const profile = await customerRepository.getCustomerProfile(UserId);

    if (!profile) {
        throw createError("Customer account not found.", 404);
    }

    const customer = await customerRepository.loginCustomer(profile.Email);

    if (!customer || !customer.PasswordHash) {
        throw createError("Customer password data is unavailable.", 500);
    }

    if (!customer.IsActive) {
        throw createError("Your account is inactive.", 403);
    }

    const isPasswordValid = await bcrypt.compare(
        OldPassword,
        customer.PasswordHash
    );

    if (!isPasswordValid) {
        throw createError("Old password is incorrect.", 401);
    }

    const NewPasswordHash = await bcrypt.hash(NewPassword, 12);

    return await customerRepository.changeCustomerPassword(
        UserId,
        customer.PasswordHash,
        NewPasswordHash
    );
};


// ======================================
// 6. GET ALL CUSTOMERS
// ======================================
const getAllCustomers = async () => {

    return await customerRepository.getAllCustomers();
};


// ======================================
// 7. GET CUSTOMER BY ID
// ======================================
const getCustomerById = async (CustomerId) => {

    const customerId = Number(CustomerId);
    if (!Number.isSafeInteger(customerId) || customerId <= 0) {
        throw createError("Valid CustomerId is required.");
    }

    const customer = await customerRepository.getCustomerById(customerId);

    if (!customer) {
        throw createError("Customer not found.", 404);
    }

    return customer;
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
