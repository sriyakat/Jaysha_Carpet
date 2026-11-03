
const express = require('express');

const router = express.Router();

const authController = require('../auth/authController.js');

// Create first Admin
router.post('/setup-admin', authController.createAdmin);

// Admin Login
router.post('/login', authController.loginAdmin);

module.exports = router;
