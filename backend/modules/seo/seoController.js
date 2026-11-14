const seoService = require("./seoService.js");

const getRobots = async (req, res) => {
    try {
        const content = await seoService.getRobots();
        res.type("text/plain").send(content);
    } catch (error) {
        res.status(500).send("User-agent: *\nAllow: /\n");
    }
};

const getSitemap = async (req, res) => {
    try {
        const xml = await seoService.getSitemap(req);
        res.type("application/xml").send(xml);
    } catch (error) {
        console.error("SEO sitemap error:", error);
        res.status(500).type("application/xml").send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
};

module.exports = { getRobots, getSitemap };
