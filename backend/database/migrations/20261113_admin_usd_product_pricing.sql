SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.Products', N'UsdPrice') IS NULL
    ALTER TABLE dbo.Products ADD UsdPrice DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Products', N'UsdDiscountPrice') IS NULL
    ALTER TABLE dbo.Products ADD UsdDiscountPrice DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.ProductVariants', N'UsdPrice') IS NULL
    ALTER TABLE dbo.ProductVariants ADD UsdPrice DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.ProductVariants', N'UsdDiscountPrice') IS NULL
    ALTER TABLE dbo.ProductVariants ADD UsdDiscountPrice DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Orders', N'UsdSubtotal') IS NULL
    ALTER TABLE dbo.Orders ADD UsdSubtotal DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Orders', N'UsdShippingCharges') IS NULL
    ALTER TABLE dbo.Orders ADD UsdShippingCharges DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.Orders', N'UsdGrandTotal') IS NULL
    ALTER TABLE dbo.Orders ADD UsdGrandTotal DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.OrderItems', N'UsdUnitPrice') IS NULL
    ALTER TABLE dbo.OrderItems ADD UsdUnitPrice DECIMAL(12, 2) NULL;

IF COL_LENGTH(N'dbo.OrderItems', N'UsdLineTotal') IS NULL
    ALTER TABLE dbo.OrderItems ADD UsdLineTotal DECIMAL(12, 2) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Products_UsdPrice')
    EXEC(N'ALTER TABLE dbo.Products ADD CONSTRAINT CK_Products_UsdPrice
        CHECK (
            (UsdPrice IS NULL OR UsdPrice > 0)
            AND (UsdDiscountPrice IS NULL OR (UsdPrice IS NOT NULL AND UsdDiscountPrice >= 0 AND UsdDiscountPrice < UsdPrice))
        );');

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_ProductVariants_UsdPrice')
    EXEC(N'ALTER TABLE dbo.ProductVariants ADD CONSTRAINT CK_ProductVariants_UsdPrice
        CHECK (
            (UsdPrice IS NULL OR UsdPrice > 0)
            AND (UsdDiscountPrice IS NULL OR (UsdPrice IS NOT NULL AND UsdDiscountPrice >= 0 AND UsdDiscountPrice < UsdPrice))
        );');

COMMIT TRANSACTION;
