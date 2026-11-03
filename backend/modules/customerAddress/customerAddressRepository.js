
const { poolPromise, sql } = require("../../config/db");

// 1. ADD ADDRESS
const addAddress = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("AddressLine", sql.NVarChar(300), data.AddressLine)
        .input("MobileNumber", sql.NVarChar(20), data.MobileNumber)
        .input("Landmark", sql.NVarChar(150), data.Landmark || null)
        .input("City", sql.NVarChar(100), data.City)
        .input("State", sql.NVarChar(100), data.State)
        .input("Country", sql.NVarChar(100), data.Country)
        .input("Pincode", sql.NVarChar(15), data.Pincode)
        .input("IsDefault", sql.Bit, data.IsDefault ?? false)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset[0];
};

// 2. GET ALL ADDRESSES
const getAllAddresses = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset || [];
};

// 3. GET ADDRESS BY ID
const getAddressById = async (customerId, addressId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("CustomerId", sql.Int, customerId)
        .input("AddressId", sql.Int, addressId)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset[0] || null;
};

// 4. UPDATE ADDRESS
const updateAddress = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE")
        .input("AddressId", sql.Int, data.AddressId)
        .input("CustomerId", sql.Int, data.CustomerId)
        .input("AddressLine", sql.NVarChar(300), data.AddressLine)
        .input("MobileNumber", sql.NVarChar(20), data.MobileNumber)
        .input("Landmark", sql.NVarChar(150), data.Landmark || null)
        .input("City", sql.NVarChar(100), data.City)
        .input("State", sql.NVarChar(100), data.State)
        .input("Country", sql.NVarChar(100), data.Country)
        .input("Pincode", sql.NVarChar(15), data.Pincode)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset[0];
};

// 5. DELETE ADDRESS
const deleteAddress = async (customerId, addressId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "DELETE")
        .input("CustomerId", sql.Int, customerId)
        .input("AddressId", sql.Int, addressId)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset[0];
};

// 6. SET DEFAULT ADDRESS
const setDefaultAddress = async (customerId, addressId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "SET_DEFAULT")
        .input("CustomerId", sql.Int, customerId)
        .input("AddressId", sql.Int, addressId)
        .execute("dbo.sp_ManageCustomerAddresses");

    return result.recordset[0];
};


module.exports = {
    addAddress,
    getAllAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
