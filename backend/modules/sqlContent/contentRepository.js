const { poolPromise, sql } = require("../../config/db");

const pageSizeMaximum = 100;

function normalizePage(page, pageSize) {
    const parsedPage = Number(page);
    const parsedPageSize = Number(pageSize);
    if (!Number.isSafeInteger(parsedPage) || parsedPage < 1) {
        const error = new Error("Page must be a positive whole number.");
        error.statusCode = 400;
        throw error;
    }
    if (!Number.isSafeInteger(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > pageSizeMaximum) {
        const error = new Error(`Page size must be between 1 and ${pageSizeMaximum}.`);
        error.statusCode = 400;
        throw error;
    }
    return { page: parsedPage, pageSize: parsedPageSize, offset: (parsedPage - 1) * parsedPageSize };
}

function pagination(page, pageSize, total) {
    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
    };
}

function bindBlogPost(request, post) {
    return request
        .input("Id", sql.NVarChar(36), post.id)
        .input("Title", sql.NVarChar(120), post.title)
        .input("Category", sql.NVarChar(60), post.category)
        .input("Excerpt", sql.NVarChar(250), post.excerpt)
        .input("Body", sql.NVarChar(sql.MAX), post.body)
        .input("ImageAlt", sql.NVarChar(200), post.imageAlt || null)
        .input("MediaUrl", sql.NVarChar(500), post.mediaUrl)
        .input("MediaType", sql.VarChar(10), post.mediaType)
        .input("DisplayOrder", sql.Int, post.displayOrder)
        .input("IsActive", sql.Bit, post.isActive)
        .input("ReadTime", sql.NVarChar(20), post.readTime);
}

function bindHomepageItem(request, sectionKey, item) {
    return request
        .input("SectionKey", sql.VarChar(30), sectionKey)
        .input("Id", sql.NVarChar(36), item.id)
        .input("Title", sql.NVarChar(120), item.title)
        .input("Eyebrow", sql.NVarChar(60), item.eyebrow || null)
        .input("Caption", sql.NVarChar(200), item.caption || null)
        .input("ButtonText", sql.NVarChar(50), item.buttonText || null)
        .input("ButtonUrl", sql.NVarChar(500), item.buttonUrl || null)
        .input("MediaUrl", sql.NVarChar(500), item.mediaUrl)
        .input("MediaType", sql.VarChar(10), item.mediaType)
        .input("DisplayOrder", sql.Int, item.displayOrder)
        .input("IsActive", sql.Bit, item.isActive);
}

const blogColumns = `
    Id AS id,
    Title AS title,
    Category AS category,
    Excerpt AS excerpt,
    Body AS body,
    ImageAlt AS imageAlt,
    MediaUrl AS mediaUrl,
    MediaType AS mediaType,
    DisplayOrder AS displayOrder,
    IsActive AS isActive,
    ReadTime AS readTime,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt`;

const blogOutputColumns = `
    INSERTED.Id AS id,
    INSERTED.Title AS title,
    INSERTED.Category AS category,
    INSERTED.Excerpt AS excerpt,
    INSERTED.Body AS body,
    INSERTED.ImageAlt AS imageAlt,
    INSERTED.MediaUrl AS mediaUrl,
    INSERTED.MediaType AS mediaType,
    INSERTED.DisplayOrder AS displayOrder,
    INSERTED.IsActive AS isActive,
    INSERTED.ReadTime AS readTime,
    INSERTED.CreatedAt AS createdAt,
    INSERTED.UpdatedAt AS updatedAt`;

const blogDeletedOutputColumns = blogOutputColumns.replaceAll("INSERTED.", "DELETED.");

const homepageColumns = `
    Id AS id,
    Title AS title,
    Eyebrow AS eyebrow,
    Caption AS caption,
    ButtonText AS buttonText,
    ButtonUrl AS buttonUrl,
    MediaUrl AS mediaUrl,
    MediaType AS mediaType,
    DisplayOrder AS displayOrder,
    IsActive AS isActive`;

const homepageOutputColumns = `
    INSERTED.Id AS id,
    INSERTED.Title AS title,
    INSERTED.Eyebrow AS eyebrow,
    INSERTED.Caption AS caption,
    INSERTED.ButtonText AS buttonText,
    INSERTED.ButtonUrl AS buttonUrl,
    INSERTED.MediaUrl AS mediaUrl,
    INSERTED.MediaType AS mediaType,
    INSERTED.DisplayOrder AS displayOrder,
    INSERTED.IsActive AS isActive`;

const homepageDeletedOutputColumns = homepageOutputColumns.replaceAll("INSERTED.", "DELETED.");

const customOrderColumns = `
    Id AS id,
    CustomerId AS customerId,
    CustomerName AS customerName,
    Email AS email,
    MobileNumber AS mobileNumber,
    Width AS width,
    Length AS length,
    SizeUnit AS sizeUnit,
    ColorName AS colorName,
    ColorHex AS colorHex,
    Notes AS notes,
    ImageUrl AS imageUrl,
    Status AS status,
    CreatedAt AS createdAt,
    UpdatedAt AS updatedAt`;

const customOrderOutputColumns = `
    INSERTED.Id AS id,
    INSERTED.CustomerId AS customerId,
    INSERTED.CustomerName AS customerName,
    INSERTED.Email AS email,
    INSERTED.MobileNumber AS mobileNumber,
    INSERTED.Width AS width,
    INSERTED.Length AS length,
    INSERTED.SizeUnit AS sizeUnit,
    INSERTED.ColorName AS colorName,
    INSERTED.ColorHex AS colorHex,
    INSERTED.Notes AS notes,
    INSERTED.ImageUrl AS imageUrl,
    INSERTED.Status AS status,
    INSERTED.CreatedAt AS createdAt,
    INSERTED.UpdatedAt AS updatedAt`;

const customOrderDeletedOutputColumns = customOrderOutputColumns.replaceAll("INSERTED.", "DELETED.");

async function getBlogPostById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Id", sql.NVarChar(36), id)
        .query(`SELECT ${blogColumns} FROM dbo.BlogPosts WHERE Id = @Id;`);
    return result.recordset[0] || null;
}

async function listBlogPosts({ includeInactive, page, pageSize }) {
    const values = normalizePage(page, pageSize);
    const pool = await poolPromise;
    const result = await pool.request()
        .input("IncludeInactive", sql.Bit, includeInactive)
        .input("Offset", sql.Int, values.offset)
        .input("PageSize", sql.Int, values.pageSize)
        .query(`
            SELECT ${blogColumns}
            FROM dbo.BlogPosts
            WHERE @IncludeInactive = 1 OR IsActive = 1
            ORDER BY DisplayOrder, Id
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT_BIG(*) AS Total
            FROM dbo.BlogPosts
            WHERE @IncludeInactive = 1 OR IsActive = 1;
        `);
    const total = Number(result.recordsets[1][0].Total);
    return { items: result.recordsets[0], pagination: pagination(values.page, values.pageSize, total) };
}

async function createBlogPost(post) {
    const pool = await poolPromise;
    const result = await bindBlogPost(pool.request(), post).query(`
        INSERT INTO dbo.BlogPosts
            (Id, Title, Category, Excerpt, Body, ImageAlt, MediaUrl, MediaType, DisplayOrder, IsActive, ReadTime)
        OUTPUT ${blogOutputColumns}
        VALUES
            (@Id, @Title, @Category, @Excerpt, @Body, @ImageAlt, @MediaUrl, @MediaType, @DisplayOrder, @IsActive, @ReadTime);
    `);
    return result.recordset[0];
}

async function updateBlogPost(post) {
    const pool = await poolPromise;
    const result = await bindBlogPost(pool.request(), post).query(`
        UPDATE dbo.BlogPosts
        SET Title = @Title, Category = @Category, Excerpt = @Excerpt, Body = @Body,
            ImageAlt = @ImageAlt, MediaUrl = @MediaUrl, MediaType = @MediaType,
            DisplayOrder = @DisplayOrder, IsActive = @IsActive, ReadTime = @ReadTime,
            UpdatedAt = SYSUTCDATETIME()
        OUTPUT ${blogOutputColumns}
        WHERE Id = @Id;
    `);
    return result.recordset[0] || null;
}

async function deleteBlogPost(id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Id", sql.NVarChar(36), id)
        .query(`DELETE FROM dbo.BlogPosts OUTPUT ${blogDeletedOutputColumns} WHERE Id = @Id;`);
    return result.recordset[0] || null;
}

async function listHomepageMedia(sectionKey, includeInactive) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("SectionKey", sql.VarChar(30), sectionKey)
        .input("IncludeInactive", sql.Bit, includeInactive)
        .query(`
            SELECT ${homepageColumns}
            FROM dbo.HomepageMediaItems
            WHERE SectionKey = @SectionKey AND (@IncludeInactive = 1 OR IsActive = 1)
            ORDER BY DisplayOrder, Id;
        `);
    return result.recordset;
}

async function getHomepageMediaById(sectionKey, id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("SectionKey", sql.VarChar(30), sectionKey)
        .input("Id", sql.NVarChar(36), id)
        .query(`
            SELECT ${homepageColumns}
            FROM dbo.HomepageMediaItems
            WHERE SectionKey = @SectionKey AND Id = @Id;
        `);
    return result.recordset[0] || null;
}

async function createHomepageMedia(sectionKey, item) {
    const pool = await poolPromise;
    const result = await bindHomepageItem(pool.request(), sectionKey, item).query(`
        INSERT INTO dbo.HomepageMediaItems
            (SectionKey, Id, Title, Eyebrow, Caption, ButtonText, ButtonUrl, MediaUrl, MediaType, DisplayOrder, IsActive)
        OUTPUT ${homepageOutputColumns}
        VALUES
            (@SectionKey, @Id, @Title, @Eyebrow, @Caption, @ButtonText, @ButtonUrl, @MediaUrl, @MediaType, @DisplayOrder, @IsActive);
    `);
    return result.recordset[0];
}

async function updateHomepageMedia(sectionKey, item) {
    const pool = await poolPromise;
    const result = await bindHomepageItem(pool.request(), sectionKey, item).query(`
        UPDATE dbo.HomepageMediaItems
        SET Title = @Title, Eyebrow = @Eyebrow, Caption = @Caption,
            ButtonText = @ButtonText, ButtonUrl = @ButtonUrl, MediaUrl = @MediaUrl,
            MediaType = @MediaType, DisplayOrder = @DisplayOrder, IsActive = @IsActive
        OUTPUT ${homepageOutputColumns}
        WHERE SectionKey = @SectionKey AND Id = @Id;
    `);
    return result.recordset[0] || null;
}

async function deleteHomepageMedia(sectionKey, id) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("SectionKey", sql.VarChar(30), sectionKey)
        .input("Id", sql.NVarChar(36), id)
        .query(`DELETE FROM dbo.HomepageMediaItems OUTPUT ${homepageDeletedOutputColumns} WHERE SectionKey = @SectionKey AND Id = @Id;`);
    return result.recordset[0] || null;
}

async function listCustomOrders({ page, pageSize, search, status }) {
    const values = normalizePage(page, pageSize);
    const pool = await poolPromise;
    const request = pool.request()
        .input("Offset", sql.Int, values.offset)
        .input("PageSize", sql.Int, values.pageSize)
        .input("Search", sql.NVarChar(150), search ? `%${search}%` : null)
        .input("Status", sql.VarChar(20), status || null);
    const result = await request.query(`
        SELECT ${customOrderColumns}
        FROM dbo.CustomOrderRequests
        WHERE (@Status IS NULL OR Status = @Status)
          AND (@Search IS NULL OR CustomerName LIKE @Search OR Email LIKE @Search
               OR MobileNumber LIKE @Search OR Id LIKE @Search)
        ORDER BY CreatedAt DESC, Id DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

        SELECT COUNT_BIG(*) AS Total
        FROM dbo.CustomOrderRequests
        WHERE (@Status IS NULL OR Status = @Status)
          AND (@Search IS NULL OR CustomerName LIKE @Search OR Email LIKE @Search
               OR MobileNumber LIKE @Search OR Id LIKE @Search);
    `);
    const total = Number(result.recordsets[1][0].Total);
    return { items: result.recordsets[0], pagination: pagination(values.page, values.pageSize, total) };
}

async function createCustomOrder(requestData) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Id", sql.NVarChar(36), requestData.id)
        .input("CustomerId", sql.Int, requestData.customerId)
        .input("CustomerName", sql.NVarChar(150), requestData.customerName)
        .input("Email", sql.NVarChar(150), requestData.email)
        .input("MobileNumber", sql.NVarChar(20), requestData.mobileNumber)
        .input("Width", sql.Decimal(8, 2), requestData.width)
        .input("Length", sql.Decimal(8, 2), requestData.length)
        .input("SizeUnit", sql.VarChar(2), requestData.sizeUnit)
        .input("ColorName", sql.NVarChar(80), requestData.colorName)
        .input("ColorHex", sql.VarChar(7), requestData.colorHex)
        .input("Notes", sql.NVarChar(1000), requestData.notes || null)
        .input("ImageUrl", sql.NVarChar(500), requestData.imageUrl)
        .query(`
            INSERT INTO dbo.CustomOrderRequests
                (Id, CustomerId, CustomerName, Email, MobileNumber, Width, Length, SizeUnit,
                 ColorName, ColorHex, Notes, ImageUrl, Status)
            OUTPUT ${customOrderOutputColumns}
            VALUES
                (@Id, @CustomerId, @CustomerName, @Email, @MobileNumber, @Width, @Length, @SizeUnit,
                 @ColorName, @ColorHex, @Notes, @ImageUrl, 'NEW');
        `);
    return result.recordset[0];
}

async function updateCustomOrderStatus(id, status) {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("Id", sql.NVarChar(36), id)
        .input("Status", sql.VarChar(20), status)
        .query(`
            UPDATE dbo.CustomOrderRequests
            SET Status = @Status, UpdatedAt = SYSUTCDATETIME()
            OUTPUT ${customOrderOutputColumns}
            WHERE Id = @Id;
        `);
    return result.recordset[0] || null;
}

async function getNewArrivalProductIds() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT ProductId
        FROM dbo.HomepageNewArrivalProducts
        ORDER BY DisplayOrder, ProductId;
    `);
    return result.recordset.map((row) => row.ProductId);
}

async function setNewArrivalProductIds(productIds) {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        await new sql.Request(transaction).query("DELETE FROM dbo.HomepageNewArrivalProducts;");
        for (let index = 0; index < productIds.length; index += 1) {
            await new sql.Request(transaction)
                .input("ProductId", sql.Int, productIds[index])
                .input("DisplayOrder", sql.Int, index)
                .query(`
                    INSERT INTO dbo.HomepageNewArrivalProducts (ProductId, DisplayOrder)
                    VALUES (@ProductId, @DisplayOrder);
                `);
        }
        await transaction.commit();
        return productIds;
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

module.exports = {
    createBlogPost,
    createCustomOrder,
    createHomepageMedia,
    deleteBlogPost,
    deleteHomepageMedia,
    getBlogPostById,
    getHomepageMediaById,
    getNewArrivalProductIds,
    listBlogPosts,
    listCustomOrders,
    listHomepageMedia,
    normalizePage,
    setNewArrivalProductIds,
    updateBlogPost,
    updateCustomOrderStatus,
    updateHomepageMedia
};
