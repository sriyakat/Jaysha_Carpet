SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'MetaTitle') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD MetaTitle NVARCHAR(70) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'MetaDescription') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD MetaDescription NVARCHAR(160) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'CanonicalBaseUrl') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD CanonicalBaseUrl NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'RobotsIndex') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD RobotsIndex BIT NOT NULL
        CONSTRAINT DF_WebsiteSettings_RobotsIndex DEFAULT 1;

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

COMMIT TRANSACTION;
