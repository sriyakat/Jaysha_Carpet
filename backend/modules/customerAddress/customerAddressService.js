
const repository = require("../customerAddress/customerAddressRepository.js");

// Common ID validation
const validateId = (id, fieldName) => {
    const value = Number(id);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${fieldName} must be a valid positive number.`);
    }

    return value;
};

// Common address validation
const validateAddress = (data) => {
    const requiredFields = [
        "AddressLine",
        "MobileNumber",
        "City",
        "State",
        "Country",
        "Pincode"
    ];

    for (const field of requiredFields) {
        if (
            typeof data[field] !== "string" ||
            !data[field].trim()
        ) {
            throw new Error(`${field} is required.`);
        }
    }

    if (data.AddressLine.length > 300)
        throw new Error("AddressLine cannot exceed 300 characters.");

    if (data.MobileNumber.length > 20)
        throw new Error("MobileNumber cannot exceed 20 characters.");

    if (!/^[0-9+\-\s()]{7,20}$/.test(data.MobileNumber))
        throw new Error("Please enter a valid mobile number.");

    if (data.Landmark && data.Landmark.length > 150)
        throw new Error("Landmark cannot exceed 150 characters.");

    if (data.City.length > 100)
        throw new Error("City cannot exceed 100 characters.");

    if (data.State.length > 100)
        throw new Error("State cannot exceed 100 characters.");

    if (data.Country.length > 100)
        throw new Error("Country cannot exceed 100 characters.");

    if (data.Pincode.length > 15)
        throw new Error("Pincode cannot exceed 15 characters.");

    if (
        data.IsDefault !== undefined &&
        typeof data.IsDefault !== "boolean"
    ) {
        throw new Error("IsDefault must be true or false.");
    }
};

// 1. ADD ADDRESS
const addAddress = async (customerId, data) => {
    validateId(customerId, "CustomerId");
    validateAddress(data);

    return await repository.addAddress({
        ...data,
        CustomerId: Number(customerId)
    });
};

// 2. GET ALL ADDRESSES
const getAllAddresses = async (customerId) => {
    validateId(customerId, "CustomerId");

    return await repository.getAllAddresses(Number(customerId));
};

// 3. GET ADDRESS BY ID
const getAddressById = async (customerId, addressId) => {
    validateId(customerId, "CustomerId");
    validateId(addressId, "AddressId");

    const address = await repository.getAddressById(
        Number(customerId),
        Number(addressId)
    );

    if (!address) {
        throw new Error("Address not found.");
    }

    return address;
};

// 4. UPDATE ADDRESS
const updateAddress = async (customerId, addressId, data) => {
    validateId(customerId, "CustomerId");
    validateId(addressId, "AddressId");
    validateAddress(data);

    const address = await repository.updateAddress({
        ...data,
        CustomerId: Number(customerId),
        AddressId: Number(addressId)
    });

    return address;
};

// 5. DELETE ADDRESS
const deleteAddress = async (customerId, addressId) => {
    validateId(customerId, "CustomerId");
    validateId(addressId, "AddressId");

    return await repository.deleteAddress(
        Number(customerId),
        Number(addressId)
    );
};

// 6. SET DEFAULT ADDRESS
const setDefaultAddress = async (customerId, addressId) => {
    validateId(customerId, "CustomerId");
    validateId(addressId, "AddressId");

    return await repository.setDefaultAddress(
        Number(customerId),
        Number(addressId)
    );
};


module.exports = {
    addAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
