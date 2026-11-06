const fs = require("node:fs/promises");
const path = require("node:path");
const { poolPromise, sql } = require("../config/db");

const uploadsDirectory = path.resolve(__dirname, "../uploads");

async function readOptionalJson(fileName) {
    try {
        return JSON.parse(await fs.readFile(path.join(uploadsDirectory, fileName), "utf8"));
    } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
    }
}

function assertList(value, fileName) {
    if (!Array.isArray(value)) throw new Error(`${fileName} must contain a JSON list.`);
    return value;
}

async function importOnce(pool, datasetKey, fileName, importRecords) {
    const records = await readOptionalJson(fileName);
    if (records === null) {
        console.log(`Skipped ${datasetKey}: no ${fileName} file found.`);
        return;
    }
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
        const request = new sql.Request(transaction);
        const marker = await request
            .input("DatasetKey", sql.VarChar(40), datasetKey)
            .query(`
                SELECT DatasetKey
                FROM dbo.FileDataImportLog WITH (UPDLOCK, HOLDLOCK)
                WHERE DatasetKey = @DatasetKey;
            `);
        if (marker.recordset.length) {
            await transaction.rollback();
            console.log(`Skipped ${datasetKey}: this dataset was already imported.`);
            return;
        }

        await importRecords(transaction, assertList(records, fileName));
        await new sql.Request(transaction)
            .input("DatasetKey", sql.VarChar(40), datasetKey)
            .query("INSERT INTO dbo.FileDataImportLog (DatasetKey) VALUES (@DatasetKey);");
        await transaction.commit();
        console.log(`Imported ${records.length} ${datasetKey} record(s).`);
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function upsertBlogPost(transaction, post) {
    const body = String(post.body || "");
    const readTime = post.readTime || `${Math.max(1, Math.ceil(body.split(/\s+/).filter(Boolean).length / 200))} min read`;
    await new sql.Request(transaction)
        .input("Id", sql.NVarChar(36), post.id)
        .input("Title", sql.NVarChar(120), post.title)
        .input("Category", sql.NVarChar(60), post.category)
        .input("Excerpt", sql.NVarChar(250), post.excerpt)
        .input("Body", sql.NVarChar(sql.MAX), body)
        .input("ImageAlt", sql.NVarChar(200), post.imageAlt || null)
        .input("MediaUrl", sql.NVarChar(500), post.mediaUrl)
        .input("MediaType", sql.VarChar(10), post.mediaType)
        .input("DisplayOrder", sql.Int, post.displayOrder)
        .input("IsActive", sql.Bit, post.isActive === true)
        .input("ReadTime", sql.NVarChar(20), readTime)
        .query(`
            UPDATE dbo.BlogPosts
            SET Title = @Title, Category = @Category, Excerpt = @Excerpt, Body = @Body,
                ImageAlt = @ImageAlt, MediaUrl = @MediaUrl, MediaType = @MediaType,
                DisplayOrder = @DisplayOrder, IsActive = @IsActive, ReadTime = @ReadTime,
                UpdatedAt = SYSUTCDATETIME()
            WHERE Id = @Id;
            IF @@ROWCOUNT = 0
                INSERT INTO dbo.BlogPosts
                    (Id, Title, Category, Excerpt, Body, ImageAlt, MediaUrl, MediaType, DisplayOrder, IsActive, ReadTime)
                VALUES
                    (@Id, @Title, @Category, @Excerpt, @Body, @ImageAlt, @MediaUrl, @MediaType, @DisplayOrder, @IsActive, @ReadTime);
        `);
}

async function importBlogPosts(transaction, posts) {
    for (const post of posts) await upsertBlogPost(transaction, post);
}

async function upsertCustomOrder(transaction, item) {
    await new sql.Request(transaction)
        .input("Id", sql.NVarChar(36), item.id)
        .input("CustomerId", sql.Int, item.customerId)
        .input("CustomerName", sql.NVarChar(150), item.customerName)
        .input("Email", sql.NVarChar(150), item.email)
        .input("MobileNumber", sql.NVarChar(20), item.mobileNumber)
        .input("Width", sql.Decimal(8, 2), item.width)
        .input("Length", sql.Decimal(8, 2), item.length)
        .input("SizeUnit", sql.VarChar(2), item.sizeUnit)
        .input("ColorName", sql.NVarChar(80), item.colorName)
        .input("ColorHex", sql.VarChar(7), item.colorHex)
        .input("Notes", sql.NVarChar(1000), item.notes || null)
        .input("ImageUrl", sql.NVarChar(500), item.imageUrl)
        .input("Status", sql.VarChar(20), item.status || "NEW")
        .input("CreatedAt", sql.DateTime2(3), item.createdAt ? new Date(item.createdAt) : new Date())
        .input("UpdatedAt", sql.DateTime2(3), item.updatedAt ? new Date(item.updatedAt) : new Date())
        .query(`
            UPDATE dbo.CustomOrderRequests
            SET CustomerId = @CustomerId, CustomerName = @CustomerName, Email = @Email,
                MobileNumber = @MobileNumber, Width = @Width, Length = @Length,
                SizeUnit = @SizeUnit, ColorName = @ColorName, ColorHex = @ColorHex,
                Notes = @Notes, ImageUrl = @ImageUrl, Status = @Status,
                CreatedAt = @CreatedAt, UpdatedAt = @UpdatedAt
            WHERE Id = @Id;
            IF @@ROWCOUNT = 0
                INSERT INTO dbo.CustomOrderRequests
                    (Id, CustomerId, CustomerName, Email, MobileNumber, Width, Length, SizeUnit,
                     ColorName, ColorHex, Notes, ImageUrl, Status, CreatedAt, UpdatedAt)
                VALUES
                    (@Id, @CustomerId, @CustomerName, @Email, @MobileNumber, @Width, @Length, @SizeUnit,
                     @ColorName, @ColorHex, @Notes, @ImageUrl, @Status, @CreatedAt, @UpdatedAt);
        `);
}

async function importCustomOrders(transaction, records) {
    for (const item of records) await upsertCustomOrder(transaction, item);
}

async function upsertHomepageItem(transaction, sectionKey, item) {
    await new sql.Request(transaction)
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
        .input("IsActive", sql.Bit, item.isActive === true)
        .query(`
            UPDATE dbo.HomepageMediaItems
            SET Title = @Title, Eyebrow = @Eyebrow, Caption = @Caption,
                ButtonText = @ButtonText, ButtonUrl = @ButtonUrl, MediaUrl = @MediaUrl,
                MediaType = @MediaType, DisplayOrder = @DisplayOrder, IsActive = @IsActive
            WHERE SectionKey = @SectionKey AND Id = @Id;
            IF @@ROWCOUNT = 0
                INSERT INTO dbo.HomepageMediaItems
                    (SectionKey, Id, Title, Eyebrow, Caption, ButtonText, ButtonUrl, MediaUrl, MediaType, DisplayOrder, IsActive)
                VALUES
                    (@SectionKey, @Id, @Title, @Eyebrow, @Caption, @ButtonText, @ButtonUrl, @MediaUrl, @MediaType, @DisplayOrder, @IsActive);
        `);
}

async function importHomepageItems(transaction, sectionKey, items) {
    for (const item of items) await upsertHomepageItem(transaction, sectionKey, item);
}

async function importNewArrivals(transaction, productIds) {
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
}

async function main() {
    const pool = await poolPromise;
    try {
        await importOnce(pool, "blog-posts", ".blog-posts.json", importBlogPosts);
        await importOnce(pool, "custom-orders", ".custom-orders.json", importCustomOrders);
        await importOnce(pool, "homepage-showcase", ".homepage-showcase.json",
            (transaction, items) => importHomepageItems(transaction, "showcase", items));
        await importOnce(pool, "homepage-offer", ".homepage-offer.json",
            (transaction, items) => importHomepageItems(transaction, "offer", items));
        await importOnce(pool, "homepage-inspiration", ".homepage-inspiration.json",
            (transaction, items) => importHomepageItems(transaction, "inspiration", items));
        await importOnce(pool, "homepage-new-arrivals", ".homepage-new-arrivals.json", importNewArrivals);
    } finally {
        await pool.close();
    }
}

main().catch((error) => {
    console.error("File data SQL import failed:", error.message);
    process.exitCode = 1;
});
