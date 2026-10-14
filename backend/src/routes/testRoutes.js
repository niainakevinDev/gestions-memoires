const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("ADMIN"),
    (req, res) => {
        res.json({
            message: "Bienvenue dans la zone administrateur."
        });
    }
);

router.get("/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Tu as accès à cette route protégée.",
        utilisateur: req.user
    });
});

module.exports = router;