
const express = require("express");
const router = express.Router();

const controller = require("../customerAddress/customerAddressController.js");

// Customer authentication middleware
const customerAuth = require("../customer/customerAuthMiddleware.js");

// Add address
router.post("/", customerAuth, controller.addAddress);

// Get all addresses
router.get("/", customerAuth, controller.getAllAddresses);

// Get address by ID
router.get("/:addressId", customerAuth, controller.getAddressById);

// Update address
router.put("/:addressId", customerAuth, controller.updateAddress);

// Delete address
router.delete("/:addressId", customerAuth, controller.deleteAddress);

// Set default address
router.patch("/:addressId/default", customerAuth, controller.setDefaultAddress);

module.exports = router;
