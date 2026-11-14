const cache = new Map();

const publicCache = (seconds = 60) => {
    const ttl = Math.max(1, Number(seconds)) * 1000;

    return (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        const key = req.originalUrl;
        const cached = cache.get(key);

        if (cached && cached.expiresAt > Date.now()) {
            res.set("X-Cache", "HIT");
            res.set("Cache-Control", `public, max-age=${Math.max(1, Number(seconds))}`);
            return res.status(cached.status).set(cached.headers).send(cached.body);
        }

        if (cached) {
            cache.delete(key);
        }

        const originalJson = res.json.bind(res);
        res.json = (body) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, {
                    status: res.statusCode,
                    headers: { "Content-Type": "application/json; charset=utf-8" },
                    body,
                    expiresAt: Date.now() + ttl
                });
            }
            res.set("X-Cache", "MISS");
            res.set("Cache-Control", `public, max-age=${Math.max(1, Number(seconds))}`);
            return originalJson(body);
        };

        next();
    };
};

const clearPublicCache = () => cache.clear();

module.exports = { publicCache, clearPublicCache };
