const { sql, poolPromise } = require("../../config/db.js");

const escapeXml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const getRobots = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT TOP 1 RobotsIndex
            FROM dbo.WebsiteSettings
        `);

    return result.recordset[0]?.RobotsIndex === false
        ? "User-agent: *\nDisallow: /\n"
        : "User-agent: *\nAllow: /\n\nDisallow: /admin/\nDisallow: /api/\nDisallow: /uploads/\n\nSitemap: /sitemap.xml\n";
};

const getSitemap = async (req) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT ProductId, Slug, UpdatedAt
            FROM dbo.Products
            WHERE IsActive = 1
            ORDER BY UpdatedAt DESC
        `);

    const settingsResult = await pool.request()
        .query(`SELECT TOP 1 CanonicalBaseUrl FROM dbo.WebsiteSettings`);

    const configured = settingsResult.recordset[0]?.CanonicalBaseUrl?.trim();
    const baseUrl = configured || `${req.protocol}://${req.get("host")}`;

    const staticUrls = ["", "/shop", "/customer/login", "/customer/register", "/blog"];
    const urls = staticUrls.map((path) => ({
        loc: `${baseUrl}${path}`,
        lastmod: null
    }));

    for (const product of result.recordset) {
        urls.push({
            loc: `${baseUrl}/products/${encodeURIComponent(product.Slug || product.ProductId)}`,
            lastmod: product.UpdatedAt ? new Date(product.UpdatedAt).toISOString() : null
        });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${escapeXml(item.loc)}</loc>${item.lastmod ? `\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;
};

module.exports = { getRobots, getSitemap };
