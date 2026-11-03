
const { sql, poolPromise } = require('../../config/db.js');

// CREATE ADMIN ==============================
const createAdmin = async (adminData) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('FullName', sql.NVarChar(150), adminData.fullName)
        .input('Email', sql.NVarChar(150), adminData.email)
        .input('PasswordHash', sql.NVarChar(255), adminData.passwordHash)
        .execute('dbo.sp_Admin_Create');

    return result.recordset?.[0] || null;
};

// GET ADMIN BY EMAIL (LOGIN) =========================
const getAdminByEmail = async (email) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input('Email', sql.NVarChar(150), email)
        .execute('dbo.sp_Admin_Login');

    return result.recordset?.[0] || null;
};

module.exports = {
    createAdmin,
    getAdminByEmail
};
