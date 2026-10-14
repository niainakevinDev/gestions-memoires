const express = require("express");
const db = require("../config/database");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const verifierRoleEtudiant = (req, res, next) => {
    if (req.user.role !== "ETUDIANT") {
        return res.status(403).json({
            message: "Accès réservé aux étudiants."
        });
    }

    next();
};

router.post("/", authMiddleware, verifierRoleEtudiant, async (req, res) => {
    let connexion;

    try {
        const userId = req.user.userId;

        const {
            titre,
            resume,
            niveau,
            formation,
            anneeUniversitaire
        } = req.body;

        // 1. Valider les champs obligatoires
        if (
            typeof titre !== "string" ||
            !titre.trim() ||
            typeof niveau !== "string" ||
            !niveau.trim() ||
            typeof formation !== "string" ||
            !formation.trim() ||
            typeof anneeUniversitaire !== "string" ||
            !anneeUniversitaire.trim()
        ) {
            return res.status(400).json({
                message: "Les champs obligatoires doivent être remplis correctement."
            });
        }

        if (
            resume !== undefined &&
            resume !== null &&
            typeof resume !== "string"
        ) {
            return res.status(400).json({
                message: "Le résumé doit être un texte."
            });
        }

        // 2. Obtenir une connexion dédiée pour la transaction
        connexion = await db.getConnection();

        await connexion.beginTransaction();

        // 3. Trouver l'étudiant connecté
        const [etudiants] = await connexion.query(
            `SELECT etudiant_id
             FROM etudiants
             WHERE user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (etudiants.length === 0) {
            await connexion.rollback();

            return res.status(404).json({
                message: "Étudiant introuvable."
            });
        }

        const etudiantId = etudiants[0].etudiant_id;

        // 4. Vérifier si l'étudiant possède déjà un mémoire
        const [memoiresExistants] = await connexion.query(
            `SELECT memoire_id
             FROM memoire_etudiants
             WHERE etudiant_id = ?
             LIMIT 1`,
            [etudiantId]
        );

        if (memoiresExistants.length > 0) {
            await connexion.rollback();

            return res.status(409).json({
                message: "Vous possédez déjà un mémoire. Vous pouvez modifier le mémoire existant."
            });
        }

        // 5. Créer le mémoire
        const [resultat] = await connexion.query(
            `INSERT INTO memoires (
                memoire_titre,
                memoire_resume,
                memoire_niveau,
                memoire_formation,
                annee_universitaire
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                titre.trim(),
                resume?.trim() || null,
                niveau.trim(),
                formation.trim(),
                anneeUniversitaire.trim()
            ]
        );

        const memoireId = resultat.insertId;

        // 6. Associer le mémoire à l'étudiant
        await connexion.query(
            `INSERT INTO memoire_etudiants (
                memoire_id,
                etudiant_id
            )
            VALUES (?, ?)`,
            [memoireId, etudiantId]
        );

        // 7. Confirmer les deux opérations
        await connexion.commit();

        return res.status(201).json({
            message: "Mémoire créé avec succès.",
            memoireId
        });

    } catch (erreur) {
        // Annuler les opérations si une erreur survient
        if (connexion) {
            try {
                await connexion.rollback();
            } catch (erreurRollback) {
                console.error(
                    "Erreur lors de l'annulation de la transaction :",
                    erreurRollback
                );
            }
        }

        console.error(
            "Erreur lors de la création du mémoire :",
            erreur
        );

        return res.status(500).json({
            message: "Erreur interne du serveur."
        });

    } finally {
        // Toujours libérer la connexion
        if (connexion) {
            connexion.release();
        }
    }
});



router.get("/", authMiddleware,verifierRoleEtudiant, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [memoires] = await db.query(
            `SELECT m.*,
                    (SELECT GROUP_CONCAT(
                        DISTINCT CONCAT(enc.encadreur_prenom, ' ', enc.encadreur_nom)
                        ORDER BY enc.encadreur_nom, enc.encadreur_prenom
                        SEPARATOR ', '
                     )
                     FROM memoire_encadreurs me_enc
                     INNER JOIN encadreurs enc ON enc.encadreur_id = me_enc.encadreur_id
                     WHERE me_enc.memoire_id = m.memoire_id) AS encadreurs
             FROM memoires m
             INNER JOIN memoire_etudiants me
                ON m.memoire_id = me.memoire_id
             INNER JOIN etudiants e
                ON me.etudiant_id = e.etudiant_id
             WHERE e.user_id = ?`,
            [userId]
        );

        res.json(memoires);

    } catch (erreur) {
        console.error("Erreur lors de la récupération des mémoires :", erreur);

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});


router.get("/:id", authMiddleware,verifierRoleEtudiant, async (req, res) => {
    try {
        const userId = req.user.userId;
        const memoireId = req.params.id;

        const [memoires] = await db.query(
            `SELECT m.*,
                    (SELECT GROUP_CONCAT(
                        DISTINCT CONCAT(enc.encadreur_prenom, ' ', enc.encadreur_nom)
                        ORDER BY enc.encadreur_nom, enc.encadreur_prenom
                        SEPARATOR ', '
                     )
                     FROM memoire_encadreurs me_enc
                     INNER JOIN encadreurs enc ON enc.encadreur_id = me_enc.encadreur_id
                     WHERE me_enc.memoire_id = m.memoire_id) AS encadreurs
             FROM memoires m
             INNER JOIN memoire_etudiants me
                 ON m.memoire_id = me.memoire_id
             INNER JOIN etudiants e
                 ON me.etudiant_id = e.etudiant_id
             WHERE m.memoire_id = ?
             AND e.user_id = ?`,
            [memoireId, userId]
        );

        if (memoires.length === 0) {
            return res.status(404).json({
                message: "Mémoire introuvable."
            });
        }

        res.json(memoires[0]);

    } catch (erreur) {
        console.error(
            "Erreur lors de la récupération du mémoire :",
            erreur
        );

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});


router.put("/:id", authMiddleware,verifierRoleEtudiant, async (req, res) => {
    try {
        const userId = req.user.userId;
        const memoireId = req.params.id;

        const {
            titre,
            resume,
            niveau,
            formation,
            anneeUniversitaire
        } = req.body;

        if (!titre || !niveau || !formation || !anneeUniversitaire) {
            return res.status(400).json({
                message: "Les champs obligatoires doivent être remplis."
            });
        }

        // Vérifier que le mémoire appartient à l'étudiant connecté
        const [memoires] = await db.query(
            `SELECT m.memoire_id
             FROM memoires m
             INNER JOIN memoire_etudiants me
                 ON m.memoire_id = me.memoire_id
             INNER JOIN etudiants e
                 ON me.etudiant_id = e.etudiant_id
             WHERE m.memoire_id = ?
             AND e.user_id = ?`,
            [memoireId, userId]
        );

        if (memoires.length === 0) {
            return res.status(404).json({
                message: "Mémoire introuvable."
            });
        }

        // Modifier le mémoire
        await db.query(
            `UPDATE memoires
             SET memoire_titre = ?,
                 memoire_resume = ?,
                 memoire_niveau = ?,
                 memoire_formation = ?,
                 annee_universitaire = ?
             WHERE memoire_id = ?`,
            [
                titre,
                resume,
                niveau,
                formation,
                anneeUniversitaire,
                memoireId
            ]
        );

        res.json({
            message: "Mémoire modifié avec succès."
        });

    } catch (erreur) {
        console.error(
            "Erreur lors de la modification du mémoire :",
            erreur
        );

        res.status(500).json({
            message: "Erreur interne du serveur."
        });
    }
});


module.exports = router;