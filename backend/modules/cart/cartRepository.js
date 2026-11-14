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

    if (cartData.ProductVariantId) {
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const result = await transaction.request()
                .input("CartId", sql.Int, cartData.CartId)
                .input("CustomerId", sql.Int, cartData.CustomerId)
                .input("CartToken", sql.NVarChar(100), cartData.CartToken)
                .input("ProductId", sql.Int, cartData.ProductId)
                .input("ProductVariantId", sql.Int, cartData.ProductVariantId)
                .input("Quantity", sql.Int, cartData.Quantity)
                .query(`
                    SET NOCOUNT ON;
                    IF NOT EXISTS (
                        SELECT 1 FROM dbo.Carts WITH (UPDLOCK, HOLDLOCK)
                        WHERE CartId = @CartId AND CartStatus = 'ACTIVE'
                          AND ((@CustomerId IS NOT NULL AND CustomerId = @CustomerId)
                            OR (@CartToken IS NOT NULL AND CartToken = @CartToken))
                    )
                    BEGIN
                        ;THROW 50005, 'Active cart not found or access denied.', 1;
                    END;

                    DECLARE @StockQuantity INT;
                    SELECT @StockQuantity = PV.StockQuantity
                    FROM dbo.ProductVariants PV WITH (UPDLOCK, HOLDLOCK)
                    INNER JOIN dbo.Products P ON P.ProductId = PV.ProductId
                    WHERE PV.ProductVariantId = @ProductVariantId
                      AND PV.ProductId = @ProductId
                      AND PV.IsActive = 1
                      AND P.IsActive = 1 AND P.IsDeleted = 0;

                    IF @StockQuantity IS NULL
                    BEGIN
                        ;THROW 50008, 'Product size is not available.', 1;
                    END;

                    DECLARE @ExistingQuantity INT;
                    SELECT @ExistingQuantity = Quantity
                    FROM dbo.CartItems WITH (UPDLOCK, HOLDLOCK)
                    WHERE CartId = @CartId AND ProductId = @ProductId
                      AND ProductVariantId = @ProductVariantId;

                    IF ISNULL(@ExistingQuantity, 0) + @Quantity > @StockQuantity
                    BEGIN
                        ;THROW 50009, 'Requested quantity exceeds available stock.', 1;
                    END;

                    IF @ExistingQuantity IS NULL
                        INSERT INTO dbo.CartItems (CartId, ProductId, ProductVariantId, Quantity)
                        VALUES (@CartId, @ProductId, @ProductVariantId, @Quantity);
                    ELSE
                        UPDATE dbo.CartItems
                        SET Quantity = Quantity + @Quantity, UpdatedAt = SYSDATETIME()
                        WHERE CartId = @CartId AND ProductId = @ProductId
                          AND ProductVariantId = @ProductVariantId;

                    SELECT * FROM dbo.CartItems
                    WHERE CartId = @CartId AND ProductId = @ProductId
                      AND ProductVariantId = @ProductVariantId;
                `);
            await transaction.commit();
            return result.recordset[0];
        } catch (error) {
            if (transaction._aborted !== true) await transaction.rollback();
            throw error;
        }
    }

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
    const storedItems = result.recordsets[1] || [];
    const pricing = storedItems.length
        ? await pool.request()
            .input("CartId", sql.Int, cartData.CartId)
            .query(`
                SELECT
                    CI.CartItemId,
                    CI.ProductVariantId,
                    PV.SizeLabel,
                    CASE WHEN PV.ProductVariantId IS NULL THEN P.Price ELSE PV.Price END AS Price,
                    CASE WHEN PV.ProductVariantId IS NULL THEN P.DiscountPrice ELSE PV.DiscountPrice END AS DiscountPrice,
                    CASE
                        WHEN PV.ProductVariantId IS NULL THEN COALESCE(NULLIF(P.DiscountPrice, 0), P.Price)
                        ELSE COALESCE(NULLIF(PV.DiscountPrice, 0), PV.Price)
                    END AS UnitPrice,
                    CASE WHEN PV.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END AS UsdPrice,
                    CASE WHEN PV.ProductVariantId IS NULL THEN P.UsdDiscountPrice ELSE PV.UsdDiscountPrice END AS UsdDiscountPrice
                FROM dbo.CartItems CI
                INNER JOIN dbo.Products P ON P.ProductId = CI.ProductId
                LEFT JOIN dbo.ProductVariants PV ON PV.ProductVariantId = CI.ProductVariantId
                WHERE CI.CartId = @CartId;
            `)
        : { recordset: [] };
    const pricesByItemId = new Map(pricing.recordset.map((item) => [item.CartItemId, item]));
    const items = storedItems.map((item) => ({
        ...item,
        ...(pricesByItemId.get(item.CartItemId ?? item.cartItemId) || {})
    }));

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
