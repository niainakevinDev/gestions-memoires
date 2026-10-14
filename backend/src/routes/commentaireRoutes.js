const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;

        const { versionId, contenu } = req.body;

        
        if (req.user.role !== "ENCADREUR") {
    return res.status(403).json({
        message: "Seuls les encadreurs peuvent ajouter des commentaires."
    });
}

        if (
    !versionId ||
    !Number.isInteger(Number(versionId)) ||
    !contenu ||
    typeof contenu !== "string" ||
    !contenu.trim()
) {
    return res.status(400).json({
        message: "Une version valide et un commentaire non vide sont obligatoires."
    });
}

const commentaire = contenu.trim();

if (commentaire.length > 5000) {
    return res.status(400).json({
        message: "Le commentaire ne doit pas dépasser 5000 caractères."
    });
}

        // 1. Trouver l'encadreur correspondant à l'utilisateur connecté
        const [encadreurs] = await db.query(
            `SELECT encadreur_id
             FROM encadreurs
             WHERE user_id = ?`,
            [userId]
        );

        if (encadreurs.length === 0) {
            return res.status(403).json({
                message: "Vous n'êtes pas enregistré comme encadreur."
            });
        }

        const encadreurId = encadreurs[0].encadreur_id;

        // 2. Vérifier que la version existe
        const [versions] = await db.query(
            `SELECT version_id, memoire_id
             FROM versions_memoires
             WHERE version_id = ?`,
            [versionId]
        );

        if (versions.length === 0) {
            return res.status(404).json({
                message: "Version du mémoire introuvable."
            });
        }

        const memoireId = versions[0].memoire_id;

        // 3. Vérifier que l'encadreur encadre bien ce mémoire
        const [relations] = await db.query(
            `SELECT *
             FROM memoire_encadreurs
             WHERE memoire_id = ?
             AND encadreur_id = ?`,
            [memoireId, encadreurId]
        );

        if (relations.length === 0) {
            return res.status(403).json({
                message: "Vous n'êtes pas l'encadreur de ce mémoire."
            });
        }

        // 4. Ajouter le commentaire
        const [result] = await db.query(
            `INSERT INTO commentaires
             (version_id, encadreur_id, contenu)
             VALUES (?, ?, ?)`,
            [versionId, encadreurId, commentaire]
        );

        res.status(201).json({
            message: "Commentaire ajouté avec succès.",
            commentaireId: result.insertId
        });

    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error);

        res.status(500).json({
            message: "Erreur serveur."
        });
    }
});

router.get("/:versionId", authMiddleware, async (req, res) => {
try {
const userId = req.user.userId;
const { versionId } = req.params;

    // Vérifier que la version existe et que l'utilisateur
    // est soit l'étudiant propriétaire, soit un encadreur affecté.
    const [versions] = await db.query(
        `SELECT v.version_id
         FROM versions_memoires v
         WHERE v.version_id = ?
           AND (
                EXISTS (
                    SELECT 1
                    FROM memoire_etudiants me
                    INNER JOIN etudiants e
                        ON e.etudiant_id = me.etudiant_id
                    WHERE me.memoire_id = v.memoire_id
                      AND e.user_id = ?
                )
                OR EXISTS (
                    SELECT 1
                    FROM memoire_encadreurs me
                    INNER JOIN encadreurs en
                        ON en.encadreur_id = me.encadreur_id
                    WHERE me.memoire_id = v.memoire_id
                      AND en.user_id = ?
                )
           )`,
        [versionId, userId, userId]
    );

    if (versions.length === 0) {
        return res.status(403).json({
            message: "Vous n'êtes pas autorisé à consulter ces commentaires."
        });
    }

    const [commentaires] = await db.query(
        `SELECT
            c.commentaire_id,
            c.version_id,
            c.encadreur_id,
            c.contenu,
            c.created_at,
            en.encadreur_nom,
            en.encadreur_prenom
         FROM commentaires c
         INNER JOIN encadreurs en
             ON en.encadreur_id = c.encadreur_id
         WHERE c.version_id = ?
         ORDER BY c.created_at DESC`,
        [versionId]
    );

    return res.status(200).json(commentaires);
} catch (error) {
    console.error(
        "Erreur lors de la récupération des commentaires :",
        error
    );

    return res.status(500).json({
        message: "Erreur serveur."
    });
}


});


module.exports = router;