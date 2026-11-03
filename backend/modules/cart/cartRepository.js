const sql = require("mssql");
const { poolPromise } = require("../../config/db");

const createCart = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CREATE_CART")
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .execute("dbo.sp_ManageCart");

    return result.recordset[0];
};

const addToCart = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "ADD")
        .input("CartId", sql.Int, cartData.CartId)
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .input("ProductId", sql.Int, cartData.ProductId)
        .input("Quantity", sql.Int, cartData.Quantity)
        .execute("dbo.sp_ManageCart");

    return result.recordset[0];
};

const getCart = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_CART")
        .input("CartId", sql.Int, cartData.CartId)
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .execute("dbo.sp_ManageCart");

    const summary = result.recordsets[0]?.[0] || null;
    const items = result.recordsets[1] || [];

    if (summary) {
        summary.CartTotal = items.reduce(
            (total, item) => total + Number(item.UnitPrice || 0) * Number(item.Quantity || 0),
            0,
        );
    }

    return { summary, items };
};

const updateCartQuantity = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_QUANTITY")
        .input("CartId", sql.Int, cartData.CartId)
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .input("CartItemId", sql.Int, cartData.CartItemId)
        .input("Quantity", sql.Int, cartData.Quantity)
        .execute("dbo.sp_ManageCart");

    return result.recordset[0];
};

const removeFromCart = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "REMOVE")
        .input("CartId", sql.Int, cartData.CartId)
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .input("CartItemId", sql.Int, cartData.CartItemId)
        .execute("dbo.sp_ManageCart");

    return result.recordset[0];
};

const clearCart = async (cartData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "CLEAR")
        .input("CartId", sql.Int, cartData.CartId)
        .input("CustomerId", sql.Int, cartData.CustomerId)
        .input("CartToken", sql.NVarChar(100), cartData.CartToken)
        .execute("dbo.sp_ManageCart");

    return result.recordset[0];
};

module.exports = {
    createCart,
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};
