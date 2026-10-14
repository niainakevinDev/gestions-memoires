const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Vérifier le format du jeton
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Token manquant ou format invalide."
        });
    }

    const token = authHeader.slice(7);

    if (!token.trim()) {
        return res.status(401).json({
            message: "Token manquant."
        });
    }

    // Vérifier la configuration du serveur
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET n'est pas configuré.");

        return res.status(500).json({
            message: "Erreur de configuration du serveur."
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token invalide ou expiré."
        });
    }
};

module.exports = authMiddleware;