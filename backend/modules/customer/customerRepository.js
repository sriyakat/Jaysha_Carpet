
const sql = require("mssql");
const { poolPromise } = require("../../config/db");


// ======================================
// 1. REGISTER CUSTOMER
// ======================================
const registerCustomer = async (customerData) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "REGISTER")

        .input("FullName", sql.NVarChar(150), customerData.FullName)
        .input("MobileNumber", sql.NVarChar(20), customerData.MobileNumber)
        .input("Email", sql.NVarChar(150), customerData.Email)
        .input("PasswordHash", sql.NVarChar(255), customerData.PasswordHash)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0];
};


// ======================================
// 2. LOGIN CUSTOMER
// ======================================
const loginCustomer = async (Email) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "LOGIN")
        .input("Email", sql.NVarChar(150), Email)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0] || null;
};


// ======================================
// 3. GET CUSTOMER PROFILE
// ======================================
const getCustomerProfile = async (UserId) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "GET_PROFILE")
        .input("UserId", sql.Int, UserId)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0] || null;
};


// ======================================
// 4. UPDATE CUSTOMER PROFILE
// ======================================
const updateCustomerProfile = async (UserId, customerData) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "UPDATE_PROFILE")
        .input("UserId", sql.Int, UserId)

        .input("FullName", sql.NVarChar(150), customerData.FullName)
        .input("MobileNumber", sql.NVarChar(20), customerData.MobileNumber)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0];
};


// ======================================
// 5. CHANGE CUSTOMER PASSWORD
// ======================================
const changeCustomerPassword = async (UserId, OldPasswordHash, NewPasswordHash) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "CHANGE_PASSWORD")
        .input("UserId", sql.Int, UserId)
        .input("OldPasswordHash", sql.NVarChar(255), OldPasswordHash)
        .input("NewPasswordHash", sql.NVarChar(255), NewPasswordHash)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0];
};


// ======================================
// 6. GET ALL CUSTOMERS (ADMIN)
// ======================================
const getAllCustomers = async () => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "GET_ALL")

        .execute("dbo.sp_ManageCustomers");

    return result.recordset || [];
};


// ======================================
// 7. GET CUSTOMER BY ID (ADMIN)
// ======================================
const getCustomerById = async (CustomerId) => {

    const pool = await poolPromise;

    const result = await pool.request()

        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("CustomerId", sql.Int, CustomerId)

        .execute("dbo.sp_ManageCustomers");

    return result.recordset[0] || null;
};

const getCustomerByMobile = async (MobileNumber) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("MobileNumber", sql.NVarChar(20), MobileNumber)
        .query(`
            SELECT TOP (1)
                U.UserId,
                C.CustomerId,
                U.FullName,
                U.Email,
                C.MobileNumber,
                U.PasswordHash,
                U.IsActive
            FROM dbo.Customers C
            INNER JOIN dbo.Users U ON U.UserId = C.UserId
            INNER JOIN dbo.Roles R ON R.RoleId = U.RoleId
            WHERE RIGHT(
                REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(C.MobileNumber, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''),
                10
            ) = @MobileNumber
              AND R.RoleName = 'CUSTOMER'
            ORDER BY C.CustomerId DESC;
        `);

    return result.recordset[0] || null;
};

const findCustomerConflict = async ({ Email, MobileNumber }) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Email", sql.NVarChar(150), Email || null)
        .input("MobileNumber", sql.NVarChar(20), MobileNumber || null)
        .query(`
            SELECT TOP (1)
                CASE
                    WHEN LOWER(U.Email) = @Email THEN 'Email'
                    ELSE 'MobileNumber'
                END AS ConflictField
            FROM dbo.Users U
            INNER JOIN dbo.Roles R ON R.RoleId = U.RoleId
            LEFT JOIN dbo.Customers C ON C.UserId = U.UserId
            WHERE R.RoleName = 'CUSTOMER'
              AND (
                    (@Email IS NOT NULL AND LOWER(U.Email) = @Email)
                    OR (
                        @MobileNumber IS NOT NULL
                        AND C.MobileNumber IS NOT NULL
                        AND RIGHT(
                            REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(C.MobileNumber, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''),
                            10
                        ) = @MobileNumber
                    )
              );
        `);

    return result.recordset[0] || null;
};

const resetCustomerPasswordByMobile = async (MobileNumber, PasswordHash) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await new sql.Request(transaction)
            .input("MobileNumber", sql.NVarChar(20), MobileNumber)
            .input("PasswordHash", sql.NVarChar(255), PasswordHash)
            .query(`
                UPDATE U
                SET PasswordHash = @PasswordHash,
                    UpdatedAt = SYSDATETIME()
                FROM dbo.Users U
                INNER JOIN dbo.Customers C ON C.UserId = U.UserId
                INNER JOIN dbo.Roles R ON R.RoleId = U.RoleId
                WHERE RIGHT(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(C.MobileNumber, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''),
                    10
                ) = @MobileNumber
                  AND R.RoleName = 'CUSTOMER'
                  AND U.IsActive = 1;
            `);

        if (result.rowsAffected[0] !== 1) {
            const error = new Error("Customer account could not be updated.");
            error.statusCode = 404;
            throw error;
        }

        await transaction.commit();
        return { Success: true };
    } catch (error) {
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        throw error;
    }
};


module.exports = {
    registerCustomer,
    loginCustomer,
    getCustomerProfile,
    updateCustomerProfile,
    changeCustomerPassword,
    getAllCustomers,
    getCustomerById,
    getCustomerByMobile,
    findCustomerConflict,
    resetCustomerPasswordByMobile
};
