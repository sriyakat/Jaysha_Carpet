const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not configured for admin authentication.");
        return res.status(500).json({
            success: false,
            message: "Admin authentication is not configured."
        });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authorization token is required."
        });
    }

    try {
        const decoded = jwt.verify(authHeader.slice(7), secret);
        if (
            typeof decoded.role !== "string"
            || decoded.role.toUpperCase() !== "ADMIN"
            || !Number.isSafeInteger(decoded.userId)
            || decoded.userId <= 0
        ) {
            return res.status(403).json({
                success: false,
                message: "Admin access only."
            });
        }

        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

module.exports = adminAuth;
