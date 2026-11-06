SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.BlogPosts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlogPosts (
        Id NVARCHAR(36) NOT NULL CONSTRAINT PK_BlogPosts PRIMARY KEY,
        Title NVARCHAR(120) NOT NULL,
        Category NVARCHAR(60) NOT NULL,
        Excerpt NVARCHAR(250) NOT NULL,
        Body NVARCHAR(MAX) NOT NULL,
        ImageAlt NVARCHAR(200) NULL,
        MediaUrl NVARCHAR(500) NOT NULL,
        MediaType VARCHAR(10) NOT NULL,
        DisplayOrder INT NOT NULL,
        IsActive BIT NOT NULL,
        ReadTime NVARCHAR(20) NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_BlogPosts_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_BlogPosts_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_BlogPosts_MediaType CHECK (MediaType IN ('image', 'video')),
        CONSTRAINT CK_BlogPosts_DisplayOrder CHECK (DisplayOrder >= 0)
    );
END;

IF OBJECT_ID(N'dbo.CustomOrderRequests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CustomOrderRequests (
        Id NVARCHAR(36) NOT NULL CONSTRAINT PK_CustomOrderRequests PRIMARY KEY,
        CustomerId INT NOT NULL,
        CustomerName NVARCHAR(150) NOT NULL,
        Email NVARCHAR(150) NOT NULL,
        MobileNumber NVARCHAR(20) NOT NULL,
        Width DECIMAL(8, 2) NOT NULL,
        Length DECIMAL(8, 2) NOT NULL,
        SizeUnit VARCHAR(2) NOT NULL,
        ColorName NVARCHAR(80) NOT NULL,
        ColorHex VARCHAR(7) NOT NULL,
        Notes NVARCHAR(1000) NULL,
        ImageUrl NVARCHAR(500) NOT NULL,
        Status VARCHAR(20) NOT NULL CONSTRAINT DF_CustomOrderRequests_Status DEFAULT 'NEW',
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_CustomOrderRequests_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_CustomOrderRequests_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_CustomOrderRequests_SizeUnit CHECK (SizeUnit IN ('cm', 'in')),
        CONSTRAINT CK_CustomOrderRequests_Status CHECK (Status IN ('NEW', 'CONTACTED', 'QUOTED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'))
    );
END;

IF OBJECT_ID(N'dbo.HomepageMediaItems', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HomepageMediaItems (
        SectionKey VARCHAR(30) NOT NULL,
        Id NVARCHAR(36) NOT NULL,
        Title NVARCHAR(120) NOT NULL,
        Eyebrow NVARCHAR(60) NULL,
        Caption NVARCHAR(200) NULL,
        ButtonText NVARCHAR(50) NULL,
        ButtonUrl NVARCHAR(500) NULL,
        MediaUrl NVARCHAR(500) NOT NULL,
        MediaType VARCHAR(10) NOT NULL,
        DisplayOrder INT NOT NULL,
        IsActive BIT NOT NULL,
        CONSTRAINT PK_HomepageMediaItems PRIMARY KEY (SectionKey, Id),
        CONSTRAINT CK_HomepageMediaItems_Section CHECK (SectionKey IN ('showcase', 'offer', 'inspiration')),
        CONSTRAINT CK_HomepageMediaItems_MediaType CHECK (MediaType IN ('image', 'video')),
        CONSTRAINT CK_HomepageMediaItems_DisplayOrder CHECK (DisplayOrder >= 0)
    );
END;

IF OBJECT_ID(N'dbo.HomepageNewArrivalProducts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HomepageNewArrivalProducts (
        ProductId INT NOT NULL CONSTRAINT PK_HomepageNewArrivalProducts PRIMARY KEY,
        DisplayOrder INT NOT NULL,
        CONSTRAINT CK_HomepageNewArrivalProducts_DisplayOrder CHECK (DisplayOrder >= 0)
    );
END;

IF OBJECT_ID(N'dbo.FileDataImportLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.FileDataImportLog (
        DatasetKey VARCHAR(40) NOT NULL CONSTRAINT PK_FileDataImportLog PRIMARY KEY,
        ImportedAt DATETIME2(3) NOT NULL CONSTRAINT DF_FileDataImportLog_ImportedAt DEFAULT SYSUTCDATETIME()
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.BlogPosts') AND name = N'IX_BlogPosts_PublicPage')
    CREATE INDEX IX_BlogPosts_PublicPage ON dbo.BlogPosts (IsActive, DisplayOrder, Id)
        INCLUDE (Title, Category, Excerpt, ImageAlt, MediaUrl, MediaType, ReadTime);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CustomOrderRequests') AND name = N'IX_CustomOrderRequests_Page')
    CREATE INDEX IX_CustomOrderRequests_Page ON dbo.CustomOrderRequests (CreatedAt DESC, Id DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CustomOrderRequests') AND name = N'IX_CustomOrderRequests_StatusPage')
    CREATE INDEX IX_CustomOrderRequests_StatusPage ON dbo.CustomOrderRequests (Status, CreatedAt DESC, Id DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HomepageMediaItems') AND name = N'IX_HomepageMediaItems_SectionOrder')
    CREATE INDEX IX_HomepageMediaItems_SectionOrder ON dbo.HomepageMediaItems (SectionKey, IsActive, DisplayOrder, Id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.HomepageNewArrivalProducts') AND name = N'IX_HomepageNewArrivalProducts_Order')
    CREATE INDEX IX_HomepageNewArrivalProducts_Order ON dbo.HomepageNewArrivalProducts (DisplayOrder, ProductId);

IF NOT EXISTS (SELECT 1 FROM dbo.BlogPosts WHERE Id = N'rug-size')
    INSERT INTO dbo.BlogPosts (Id, Title, Category, Excerpt, Body, ImageAlt, MediaUrl, MediaType, DisplayOrder, IsActive, ReadTime)
    VALUES (N'rug-size', N'The right rug size can change the whole room', N'A ROOM-BY-ROOM GUIDE',
        N'A simple way to make your living space feel more settled, spacious and connected.',
        N'A rug is more than a finishing touch: it helps define where a room begins and where it comes together. Before choosing one, measure the seating area and think about how people move through the space.

In a living room, a generous rug that reaches beneath at least the front legs of the sofa and chairs can make separate pieces feel like one considered arrangement. In a smaller room, leave a visible border of floor around the rug so the space still feels open.

For bedrooms, let the rug extend beyond the sides and foot of the bed where the layout allows. Always compare the measurements with your furniture and the product’s listed size before ordering.',
        N'Calm neutral living room arranged around a pale rug', N'/images/rug-showcase/neutral-interior.png', 'image', 0, 1, N'4 min read');

IF NOT EXISTS (SELECT 1 FROM dbo.BlogPosts WHERE Id = N'colour-and-pattern')
    INSERT INTO dbo.BlogPosts (Id, Title, Category, Excerpt, Body, ImageAlt, MediaUrl, MediaType, DisplayOrder, IsActive, ReadTime)
    VALUES (N'colour-and-pattern', N'Let a patterned rug tell your colour story', N'THE ART OF LAYERING',
        N'Bring character into a room while keeping the rest of your palette beautifully balanced.',
        N'A patterned rug can be the starting point for a room rather than the last detail. Pick one or two colours from its design and repeat them in smaller accents—perhaps a cushion, a piece of art or a favourite vase.

If the rug has a strong pattern, let quieter textures and simpler shapes share the space. If your furniture is already full of colour, a softer rug can give the eye somewhere to rest.

There is no single formula. Lay out a few fabric or paint samples beside the rug in the room’s natural light, and choose the combination that feels like home to you.',
        N'Traditional red patterned rug bringing colour to a light living room', N'/images/rug-showcase/red-persian.png', 'image', 1, 1, N'3 min read');

IF NOT EXISTS (SELECT 1 FROM dbo.BlogPosts WHERE Id = N'everyday-care')
    INSERT INTO dbo.BlogPosts (Id, Title, Category, Excerpt, Body, ImageAlt, MediaUrl, MediaType, DisplayOrder, IsActive, ReadTime)
    VALUES (N'everyday-care', N'A gentler routine for the rug you live on', N'CARE FOR YOUR CARPET',
        N'A few mindful habits can help keep everyday spaces looking welcoming for longer.',
        N'Start with the care guidance provided for your particular rug, since fibres and construction can need different treatment. Gentle, regular vacuuming helps manage everyday dust; use a suitable setting and avoid aggressive brushing unless the care label recommends it.

For a fresh spill, lift away any solids and blot the area with a clean, light-coloured cloth. Work from the outside toward the centre and avoid rubbing, which can spread the mark or disturb the pile.

A rug pad can help limit movement, and rotating a rug now and then may even out the effects of foot traffic and sunlight. For a stubborn stain or delicate fibre, ask a professional cleaner before trying a new product.',
        N'Green geometric rug in a welcoming home with a relaxed dog', N'/images/rug-showcase/pet-friendly-green.png', 'image', 2, 1, N'4 min read');

IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'showcase' AND Id = N'sculptural-forms')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Eyebrow, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('showcase', N'sculptural-forms', N'Sculptural Forms', N'FORM & FEEL', N'', N'/images/rug-showcase/organic-black-ivory.png', 'image', 0, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'showcase' AND Id = N'earth-in-motion')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Eyebrow, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('showcase', N'earth-in-motion', N'Earth in Motion', N'WARM TONES', N'', N'/images/rug-showcase/terracotta-shag.png', 'image', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'showcase' AND Id = N'soft-minimalism')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Eyebrow, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('showcase', N'soft-minimalism', N'Soft Minimalism', N'QUIET LAYERS', N'', N'/images/rug-showcase/warm-neutral.png', 'image', 2, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'showcase' AND Id = N'curated-interior-moods')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Eyebrow, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('showcase', N'curated-interior-moods', N'Curated Interior Moods', N'ROOM NOTES', N'', N'/images/rug-showcase/blue-floral.png', 'image', 3, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'inspiration' AND Id = N'soft-neutrals')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('inspiration', N'soft-neutrals', N'Soft neutrals', N'Quiet layers, natural light.', N'/images/rug-showcase/warm-neutral.png', 'image', 0, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'inspiration' AND Id = N'a-little-heritage')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('inspiration', N'a-little-heritage', N'A little heritage', N'Pattern with a sense of place.', N'/images/rug-showcase/red-medallion.png', 'image', 1, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'inspiration' AND Id = N'warm-modern')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('inspiration', N'warm-modern', N'Warm modern', N'An easy way to add warmth.', N'/images/rug-showcase/terracotta-shag.png', 'image', 2, 1);
IF NOT EXISTS (SELECT 1 FROM dbo.HomepageMediaItems WHERE SectionKey = 'inspiration' AND Id = N'colour-considered')
    INSERT INTO dbo.HomepageMediaItems (SectionKey, Id, Title, Caption, MediaUrl, MediaType, DisplayOrder, IsActive)
    VALUES ('inspiration', N'colour-considered', N'Colour, considered', N'A thoughtful note of blue.', N'/images/rug-showcase/blue-floral.png', 'image', 3, 1);

COMMIT TRANSACTION;
