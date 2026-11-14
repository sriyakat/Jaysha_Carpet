SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'MetaTitle') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD MetaTitle NVARCHAR(70) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'MetaDescription') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD MetaDescription NVARCHAR(160) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'CanonicalBaseUrl') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD CanonicalBaseUrl NVARCHAR(500) NULL;

IF COL_LENGTH(N'dbo.WebsiteSettings', N'RobotsIndex') IS NULL
    ALTER TABLE dbo.WebsiteSettings ADD RobotsIndex BIT NOT NULL CONSTRAINT DF_WebsiteSettings_RobotsIndex DEFAULT 1;

IF COL_LENGTH(N'dbo.Products', N'UpdatedAt') IS NULL
    ALTER TABLE dbo.Products ADD UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSUTCDATETIME();

IF OBJECT_ID(N'dbo.StoreAnalyticsEvents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.StoreAnalyticsEvents (
        EventId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_StoreAnalyticsEvents PRIMARY KEY,
        EventType NVARCHAR(30) NOT NULL,
        ProductId INT NULL,
        SessionKey NVARCHAR(100) NULL,
        CustomerId INT NULL,
        OrderId BIGINT NULL,
        EventValue DECIMAL(12,2) NULL,
        Metadata NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_StoreAnalyticsEvents_CreatedAt DEFAULT SYSUTCDATETIME()
    );

    CREATE INDEX IX_StoreAnalyticsEvents_TypeDate
        ON dbo.StoreAnalyticsEvents (EventType, CreatedAt DESC)
        INCLUDE (ProductId, CustomerId, OrderId, EventValue, SessionKey);
END;

IF COL_LENGTH(N'dbo.Coupons', N'UsageCount') IS NULL
    ALTER TABLE dbo.Coupons ADD UsageCount INT NOT NULL CONSTRAINT DF_Coupons_UsageCount DEFAULT 0;

COMMIT TRANSACTION;
