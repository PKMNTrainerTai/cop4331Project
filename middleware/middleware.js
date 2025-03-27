// authenticateMiddleware.js
import jwt from "jsonwebtoken";

export const authenticateMiddleware = (req, res, next)=> {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!decoded) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error("Error verifying token:", error);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
}
