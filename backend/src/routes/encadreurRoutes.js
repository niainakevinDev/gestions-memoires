const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Récupérer les mémoires affectés à l'encadreur connecté
router.get("/memoires", authMiddleware, async (req, res) => {
try {
const userId = req.user.userId;


    // Vérifier que l'utilisateur possède bien un profil encadreur
    const [encadreurs] = await db.query(
        `SELECT encadreur_id
         FROM encadreurs
         WHERE user_id = ?`,
        [userId]
    );

    if (encadreurs.length === 0) {
        return res.status(404).json({
            message: "Profil encadreur introuvable."
        });
    }

    const encadreurId = encadreurs[0].encadreur_id;

    // Récupérer uniquement les mémoires affectés à cet encadreur
    const [memoires] = await db.query(
        `SELECT DISTINCT
            m.memoire_id,
            m.memoire_titre,
            m.memoire_resume,
            m.memoire_niveau,
            m.memoire_formation,
            m.annee_universitaire
         FROM memoires m
         INNER JOIN memoire_encadreurs me
            ON m.memoire_id = me.memoire_id
         WHERE me.encadreur_id = ?
         ORDER BY m.memoire_id DESC`,
        [encadreurId]
    );

    return res.status(200).json(memoires);

} catch (erreur) {
    console.error(
        "Erreur lors de la récupération des mémoires de l'encadreur :",
        erreur
    );

    return res.status(500).json({
        message: "Erreur interne du serveur."
    });
}


});

module.exports = router;
