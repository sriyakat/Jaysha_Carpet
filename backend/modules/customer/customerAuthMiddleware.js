
const jwt = require("jsonwebtoken");

const JWT_SECRET =
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;


// ======================================
// CUSTOMER AUTH MIDDLEWARE
// ======================================
const customerAuth = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Authorization token is required."
            });

        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        if (
            decoded.RoleName !== "CUSTOMER"
            || !Number.isSafeInteger(decoded.UserId)
            || decoded.UserId <= 0
        ) {

            return res.status(403).json({
                success: false,
                message: "Customer access only."
            });

        }

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }
};


module.exports = customerAuth;
