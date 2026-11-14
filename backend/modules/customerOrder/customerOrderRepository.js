
const { poolPromise, sql } = require("../../config/db");

// 1. CREATE ORDER
const createOrder = async (data) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await transaction.request()
            .input("CustomerId", sql.Int, data.CustomerId)
            .input("AddressId", sql.Int, data.AddressId)
            .input("CartId", sql.Int, data.CartId)
            .input("PaymentMethod", sql.NVarChar(30), data.PaymentMethod)
            .input("ShippingCharges", sql.Decimal(12, 2), data.ShippingCharges)
            .input("ShippingChargesUsd", sql.Decimal(12, 2), data.ShippingChargesUsd ?? null)
            .input("TaxAmount", sql.Decimal(12, 2), data.TaxAmount)
            .input("CustomerNotes", sql.NVarChar(500), data.CustomerNotes || null)
            .input("CurrencyCode", sql.Char(3), data.CurrencyCode || "INR")
            .input("InrPerUsd", sql.Decimal(12, 6), data.InrPerUsd)
            .query(`
                SET XACT_ABORT ON;
                SET NOCOUNT ON;

                IF @CurrencyCode NOT IN ('INR', 'USD')
                BEGIN
                    ;THROW 50030, 'Unsupported order currency.', 1;
                END;
                IF @CurrencyCode = 'USD' AND (ISNULL(@InrPerUsd, 0) <= 0 OR ISNULL(@ShippingChargesUsd, -1) < 0)
                BEGIN
                    ;THROW 50031, 'International order pricing is incomplete.', 1;
                END;

                IF NOT EXISTS (SELECT 1 FROM dbo.Customers WHERE CustomerId = @CustomerId)
                BEGIN
                    ;THROW 50004, 'Customer not found.', 1;
                END;
                IF NOT EXISTS (SELECT 1 FROM dbo.CustomerAddresses WHERE AddressId = @AddressId AND CustomerId = @CustomerId)
                BEGIN
                    ;THROW 50005, 'Invalid delivery address.', 1;
                END;
                IF NOT EXISTS (
                    SELECT 1 FROM dbo.Carts WITH (UPDLOCK, HOLDLOCK)
                    WHERE CartId = @CartId AND CustomerId = @CustomerId AND CartStatus = 'ACTIVE'
                )
                BEGIN
                    ;THROW 50006, 'Active cart not found.', 1;
                END;
                IF NOT EXISTS (SELECT 1 FROM dbo.CartItems WITH (UPDLOCK, HOLDLOCK) WHERE CartId = @CartId)
                BEGIN
                    ;THROW 50007, 'Your cart is empty.', 1;
                END;

                IF EXISTS (
                    SELECT 1
                    FROM dbo.CartItems CI
                    INNER JOIN dbo.Products P WITH (UPDLOCK, HOLDLOCK) ON P.ProductId = CI.ProductId
                    LEFT JOIN dbo.ProductVariants PV WITH (UPDLOCK, HOLDLOCK) ON PV.ProductVariantId = CI.ProductVariantId
                    WHERE CI.CartId = @CartId
                      AND (
                        P.IsActive = 0 OR P.IsDeleted = 1
                        OR (CI.ProductVariantId IS NULL AND P.StockQuantity < CI.Quantity)
                        OR (CI.ProductVariantId IS NOT NULL AND (
                            PV.ProductVariantId IS NULL OR PV.ProductId <> P.ProductId OR PV.IsActive = 0 OR PV.StockQuantity < CI.Quantity
                        ))
                      )
                )
                BEGIN
                    ;THROW 50008, 'One or more products or sizes are unavailable or have insufficient stock.', 1;
                END;

                IF EXISTS (
                    SELECT 1
                    FROM dbo.CartItems CI
                    INNER JOIN dbo.Products P ON P.ProductId = CI.ProductId
                    WHERE CI.CartId = @CartId
                      AND CI.ProductVariantId IS NULL
                      AND EXISTS (
                        SELECT 1 FROM dbo.ProductVariants PV
                        WHERE PV.ProductId = P.ProductId AND PV.IsActive = 1
                      )
                )
                BEGIN
                    ;THROW 50032, 'Choose a size for every product before checkout.', 1;
                END;

                IF @CurrencyCode = 'USD' AND EXISTS (
                    SELECT 1
                    FROM dbo.CartItems CI
                    INNER JOIN dbo.Products P ON P.ProductId = CI.ProductId
                    LEFT JOIN dbo.ProductVariants PV ON PV.ProductVariantId = CI.ProductVariantId
                    WHERE CI.CartId = @CartId
                      AND CASE WHEN CI.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END IS NULL
                )
                BEGIN
                    ;THROW 50033, 'USD price is not set for one or more items.', 1;
                END;

                DECLARE @Lines TABLE (
                    ProductId INT NOT NULL,
                    ProductVariantId INT NULL,
                    ProductName NVARCHAR(200) NOT NULL,
                    SKU NVARCHAR(60) NOT NULL,
                    SizeLabel NVARCHAR(100) NULL,
                    Quantity INT NOT NULL,
                    UnitPrice DECIMAL(12, 2) NOT NULL,
                    LineTotal DECIMAL(12, 2) NOT NULL,
                    UsdUnitPrice DECIMAL(12, 2) NULL,
                    UsdLineTotal DECIMAL(12, 2) NULL
                );

                INSERT INTO @Lines
                SELECT
                    P.ProductId,
                    CI.ProductVariantId,
                    P.ProductName,
                    P.SKU,
                    PV.SizeLabel,
                    CI.Quantity,
                    CASE WHEN @CurrencyCode = 'USD'
                        THEN CAST(ROUND(COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.UsdDiscountPrice, 0) ELSE NULLIF(PV.UsdDiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END
                        ) * @InrPerUsd, 2) AS DECIMAL(12, 2))
                        ELSE COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.DiscountPrice, 0) ELSE NULLIF(PV.DiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.Price ELSE PV.Price END
                        )
                    END,
                    CAST((CASE WHEN @CurrencyCode = 'USD'
                        THEN ROUND(COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.UsdDiscountPrice, 0) ELSE NULLIF(PV.UsdDiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END
                        ) * @InrPerUsd, 2)
                        ELSE COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.DiscountPrice, 0) ELSE NULLIF(PV.DiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.Price ELSE PV.Price END
                        )
                    END) * CI.Quantity AS DECIMAL(12, 2)),
                    CASE WHEN @CurrencyCode = 'USD'
                        THEN COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.UsdDiscountPrice, 0) ELSE NULLIF(PV.UsdDiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END
                        )
                        ELSE NULL
                    END,
                    CASE WHEN @CurrencyCode = 'USD'
                        THEN CAST(COALESCE(
                            CASE WHEN CI.ProductVariantId IS NULL THEN NULLIF(P.UsdDiscountPrice, 0) ELSE NULLIF(PV.UsdDiscountPrice, 0) END,
                            CASE WHEN CI.ProductVariantId IS NULL THEN P.UsdPrice ELSE PV.UsdPrice END
                        ) * CI.Quantity AS DECIMAL(12, 2))
                        ELSE NULL
                    END
                FROM dbo.CartItems CI
                INNER JOIN dbo.Products P ON P.ProductId = CI.ProductId
                LEFT JOIN dbo.ProductVariants PV ON PV.ProductVariantId = CI.ProductVariantId
                WHERE CI.CartId = @CartId;

                DECLARE @Subtotal DECIMAL(12, 2) = (SELECT SUM(LineTotal) FROM @Lines);
                DECLARE @UsdSubtotal DECIMAL(12, 2) = (SELECT SUM(UsdLineTotal) FROM @Lines);
                DECLARE @GrandTotal DECIMAL(12, 2) = @Subtotal + @ShippingCharges + @TaxAmount;
                DECLARE @UsdGrandTotal DECIMAL(12, 2) = CASE WHEN @CurrencyCode = 'USD'
                    THEN @UsdSubtotal + @ShippingChargesUsd ELSE NULL END;
                DECLARE @OrderNumber NVARCHAR(40) =
                    'ORD' + CONVERT(CHAR(8), GETDATE(), 112)
                    + UPPER(LEFT(REPLACE(CONVERT(VARCHAR(36), NEWID()), '-', ''), 12));
                DECLARE @NewOrderId BIGINT;

                INSERT INTO dbo.Orders (
                    OrderNumber, CustomerId, CustomerName, MobileNumber, Email,
                    AddressLine, Landmark, City, State, Country, Pincode,
                    Subtotal, DiscountAmount, ShippingCharges, TaxAmount, GrandTotal,
                    PaymentMethod, PaymentStatus, OrderStatus, CustomerNotes,
                    CurrencyCode, InrPerUsd, UsdSubtotal, UsdShippingCharges, UsdGrandTotal
                )
                SELECT
                    @OrderNumber, C.CustomerId, C.FullName, CA.MobileNumber, C.Email,
                    CA.AddressLine, CA.Landmark, CA.City, CA.State, CA.Country, CA.Pincode,
                    @Subtotal, 0, @ShippingCharges, @TaxAmount, @GrandTotal,
                    @PaymentMethod, 'PENDING', 'PLACED', @CustomerNotes,
                    @CurrencyCode, @InrPerUsd,
                    CASE WHEN @CurrencyCode = 'USD' THEN @UsdSubtotal ELSE NULL END,
                    CASE WHEN @CurrencyCode = 'USD' THEN @ShippingChargesUsd ELSE NULL END,
                    @UsdGrandTotal
                FROM dbo.Customers C
                INNER JOIN dbo.CustomerAddresses CA ON CA.CustomerId = C.CustomerId
                WHERE C.CustomerId = @CustomerId AND CA.AddressId = @AddressId;

                SET @NewOrderId = SCOPE_IDENTITY();

                INSERT INTO dbo.OrderItems (
                    OrderId, ProductId, ProductName, SKU, Quantity, UnitPrice,
                    DiscountAmount, LineTotal, ProductVariantId, SizeLabel,
                    UsdUnitPrice, UsdLineTotal
                )
                SELECT
                    @NewOrderId, ProductId, ProductName, SKU, Quantity, UnitPrice,
                    0, LineTotal, ProductVariantId, SizeLabel, UsdUnitPrice, UsdLineTotal
                FROM @Lines;

                UPDATE P
                SET P.StockQuantity = P.StockQuantity - L.Quantity, P.UpdatedAt = SYSDATETIME()
                FROM dbo.Products P
                INNER JOIN @Lines L ON L.ProductId = P.ProductId
                WHERE L.ProductVariantId IS NULL;

                UPDATE PV
                SET PV.StockQuantity = PV.StockQuantity - L.Quantity
                FROM dbo.ProductVariants PV
                INNER JOIN @Lines L ON L.ProductVariantId = PV.ProductVariantId
                WHERE L.ProductVariantId IS NOT NULL;

                UPDATE dbo.Carts
                SET CartStatus = 'CONVERTED', UpdatedAt = SYSDATETIME()
                WHERE CartId = @CartId AND CustomerId = @CustomerId;

                SELECT * FROM dbo.Orders WHERE OrderId = @NewOrderId;
                SELECT * FROM dbo.OrderItems WHERE OrderId = @NewOrderId;
            `);

        await transaction.commit();
        return { order: result.recordsets?.[0]?.[0] || null, items: result.recordsets?.[1] || [] };
    } catch (error) {
        if (transaction._aborted !== true) {
            await transaction.rollback();
        }
        throw error;
    }
};


// 2. GET CUSTOMER ORDERS
const getMyOrders = async (customerId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_MY_ORDERS")
        .input("CustomerId", sql.Int, customerId)
        .execute("dbo.sp_ManageOrders");

    return result.recordset;
};


// 3. GET ORDER BY ID
const getOrderById = async (customerId, orderId) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_BY_ID")
        .input("CustomerId", sql.Int, customerId)
        .input("OrderId", sql.BigInt, orderId)
        .execute("dbo.sp_ManageOrders");

    return {
        order: result.recordsets?.[0]?.[0] || null,
        items: result.recordsets?.[1] || []
    };
};


// 4. GET ALL ORDERS (ADMIN)
const getAllOrders = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "GET_ALL")
        .execute("dbo.sp_ManageOrders");

    return result.recordset;
};


// 5. UPDATE ORDER STATUS (ADMIN)
const updateOrderStatus = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_STATUS")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("OrderStatus", sql.NVarChar(30), data.OrderStatus)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 6. UPDATE PAYMENT STATUS (ADMIN/SYSTEM)
const updatePaymentStatus = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_PAYMENT")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("PaymentStatus", sql.NVarChar(30), data.PaymentStatus)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 7. UPDATE TRACKING NUMBER (ADMIN)
const updateTrackingNumber = async (data) => {
    const pool = await poolPromise;

    const result = await pool.request()
        .input("Action", sql.NVarChar(30), "UPDATE_TRACKING")
        .input("OrderId", sql.BigInt, data.OrderId)
        .input("TrackingNumber", sql.NVarChar(100), data.TrackingNumber)
        .execute("dbo.sp_ManageOrders");

    return result.recordset?.[0] || null;
};


// 8. CANCEL CUSTOMER ORDER
const cancelOrder = async (customerId, orderId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const result = await transaction.request()
            .input("CustomerId", sql.Int, customerId)
            .input("OrderId", sql.BigInt, orderId)
            .query(`
                SET XACT_ABORT ON;
                SET NOCOUNT ON;
                DECLARE @OrderStatus NVARCHAR(30);

                SELECT @OrderStatus = OrderStatus
                FROM dbo.Orders WITH (UPDLOCK, HOLDLOCK)
                WHERE OrderId = @OrderId AND CustomerId = @CustomerId;

                IF @OrderStatus IS NULL
                BEGIN
                    ;THROW 50022, 'Order not found.', 1;
                END;
                IF @OrderStatus NOT IN ('PLACED', 'CONFIRMED')
                BEGIN
                    ;THROW 50023, 'This order cannot be cancelled now.', 1;
                END;

                UPDATE P
                SET P.StockQuantity = P.StockQuantity + OI.Quantity, P.UpdatedAt = SYSDATETIME()
                FROM dbo.Products P
                INNER JOIN dbo.OrderItems OI ON OI.ProductId = P.ProductId
                WHERE OI.OrderId = @OrderId AND OI.ProductVariantId IS NULL;

                UPDATE PV
                SET PV.StockQuantity = PV.StockQuantity + OI.Quantity
                FROM dbo.ProductVariants PV
                INNER JOIN dbo.OrderItems OI ON OI.ProductVariantId = PV.ProductVariantId
                WHERE OI.OrderId = @OrderId AND OI.ProductVariantId IS NOT NULL;

                UPDATE dbo.Orders
                SET OrderStatus = 'CANCELLED', UpdatedAt = SYSDATETIME()
                WHERE OrderId = @OrderId AND CustomerId = @CustomerId;

                SELECT * FROM dbo.Orders WHERE OrderId = @OrderId;
            `);

        await transaction.commit();
        return result.recordset?.[0] || null;
    } catch (error) {
        if (transaction._aborted !== true) await transaction.rollback();
        throw error;
    }
};


// 9. GET ORDER ITEMS
const getOrderItems = async (orderId, customerId = null) => {
    const pool = await poolPromise;

    const request = pool.request()
        .input("Action", sql.NVarChar(30), "GET_ORDER_ITEMS")
        .input("OrderId", sql.BigInt, orderId);

    if (customerId !== null) {
        request.input("CustomerId", sql.Int, customerId);
    }

    const result = await request.execute("dbo.sp_ManageOrders");

    return result.recordset;
};


module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    updateTrackingNumber,
    cancelOrder,
    getOrderItems
};
