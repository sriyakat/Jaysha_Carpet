SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'InrPerUsd') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD InrPerUsd DECIMAL(12, 6) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'InternationalShippingRates') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD InternationalShippingRates NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'ShippingPolicy') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD ShippingPolicy NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'ReturnPolicy') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD ReturnPolicy NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'PrivacyPolicy') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD PrivacyPolicy NVARCHAR(MAX) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'TermsAndConditions') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD TermsAndConditions NVARCHAR(MAX) NULL;

UPDATE TOP (1) dbo.WebsiteSettings
SET ShippingPolicy = N'Shipping costs and estimated delivery times are shown before checkout. International import VAT, customs duties and local charges are not included in the order total. If local authorities charge them, they are payable by the customer on delivery.'
WHERE ShippingPolicy IS NULL;

IF COL_LENGTH(N'dbo.Orders', N'CurrencyCode') IS NULL
    ALTER TABLE dbo.Orders ADD CurrencyCode CHAR(3) NOT NULL
        CONSTRAINT DF_Orders_CurrencyCode DEFAULT 'INR';

IF COL_LENGTH(N'dbo.Orders', N'InrPerUsd') IS NULL
    ALTER TABLE dbo.Orders ADD InrPerUsd DECIMAL(12, 6) NULL;

IF COL_LENGTH(N'dbo.Payments', N'CurrencyCode') IS NULL
    ALTER TABLE dbo.Payments ADD CurrencyCode CHAR(3) NOT NULL
        CONSTRAINT DF_Payments_CurrencyCode DEFAULT 'INR';

IF COL_LENGTH(N'dbo.Payments', N'InrPerUsd') IS NULL
    ALTER TABLE dbo.Payments ADD InrPerUsd DECIMAL(12, 6) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Orders_CurrencySnapshot')
    ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_CurrencySnapshot
        CHECK (
            (CurrencyCode = 'INR' AND InrPerUsd IS NULL)
            OR (CurrencyCode = 'USD' AND InrPerUsd > 0)
        );

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Payments_CurrencySnapshot')
    ALTER TABLE dbo.Payments ADD CONSTRAINT CK_Payments_CurrencySnapshot
        CHECK (
            (CurrencyCode = 'INR' AND InrPerUsd IS NULL)
            OR (CurrencyCode = 'USD' AND InrPerUsd > 0)
        );

COMMIT TRANSACTION;
